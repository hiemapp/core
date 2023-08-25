import DeviceConnector from './DeviceConnector';
import DeviceDriver from './DeviceDriver';
import ExtensionController from '../extensions/ExtensionController';
import ModelWithProps from '../lib/ModelWithProps';
import WebSocket from '../lib/WebSocket';
import type { DeviceDriverManifestInputType } from './DeviceDriver.types';
import DeviceController from './DeviceController';
import RecordManager from '../records/RecordManager';
import _ from 'lodash';
import type { DeviceProps, DevicePropsSerialized, DeviceInputMetadata } from './Device.types';
import type { ModelWithPropsConfig } from '../lib/ModelWithProps';

export default class Device extends ModelWithProps<DeviceProps, DevicePropsSerialized> {
    __modelConfig(): ModelWithPropsConfig<DeviceProps, DevicePropsSerialized> {
        return {
            controller: DeviceController,

            filterProps: {
                name: false
            },
            dynamicProps: {
                connection: () => {
                    return {
                        exists: true,
                        isOpen: true
                    }
                },
                state: () => {
                    if (this.driver) {
                        return this.driver.getState().toJSON();
                    }

                    return {
                        isActive: false,
                        display: {}
                    }
                }
            },
            defaults: {
                name: 'test',
                icon: 'test',
                color: 'red',
                driver: {
                    type: null,
                    options: {}
                },
                connector: {
                    type: null,
                    options: {}
                },
                options: {
                    recording: {
                        enabled: false,
                        cooldown: 5,
                        flushThreshold: 5
                    }
                },
                metadata: {}
            }
        }
    };

    private _driver?: DeviceDriver;
    get driver() {
        return this._driver;
    }

    private _connection?: DeviceConnector;
    get connection() {
        if (!this._connection) {
            throw new Error(`${this} has no connection.`);
        }

        return this._connection;
    }

    private _records: RecordManager;
    get records() {
        return this._records;
    }

    protected init() {
        try {
            this.initDriver();

            if (this._driver) {
                this.initRecordManager();
                this.initConnector();
            }
        } catch (err: any) {
            this.logger.error('Initialization error: ', { err });
        }
    }

    isReady() {
        return this.getErrors().length === 0;
    }

    getErrors(): Error[] {
        let codes = [];
        
        if(!(this._driver instanceof DeviceDriver)) {
            codes.push('DRIVER_NOT_INITIALIZED');
        } else if(!(this._connection instanceof DeviceConnector)) {
            codes.push('CONNECTION_NOT_INITIALIZED');
        } else if(this._connection?.isOpen !== true) {
            codes.push('CONNECTION_NOT_OPEN');
        }

        return codes.map(code => new Error(code));
    }

    supportsInputOfType(type: DeviceDriverManifestInputType) {
        return this.driver && this.driver.getInputs().filter(i => i.type === type).length > 0;
    }

    getInput(name: string): DeviceInputMetadata {
        return this.getMetadata(`__INPUTS__.${name}`) ?? { value: null };
    }

    async performInput(name: string, value: any): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const errors = this.getErrors();
                if(errors.length > 0) {
                    return reject(errors[0].message);
                }
                
                if (!this._driver!.manifest.getArr('inputs').some(i => i.name === name)) {
                    return reject(new Error('INPUT_NOT_FOUND'));
                }

                this.logger.debug(`Changing value of input '${name}'.`, { meta: { value } });
                this._driver!.handleInput(name, value, (err) => {
                    if (err) throw err;

                    this.setMetadata(`__INPUTS__.${name}`, { value });
                    this.emit('input', { name, value });

                    this.emitClientUpdate();
                    resolve();
                });
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Get the value of an option.
     * @param keypath - The key of the option to get.
     * @returns The value of the option.
     */
    getOption(keypath: string) {
        return _.get(this.getProp('options'), keypath);
    }

    /**
     * Get the value of metadata property at keypath.
     * @param keypath - The keypath of the metadata property to get.
     * @returns The value of the metadata property.
     */
    getMetadata(keypath: string): any {
        return _.get(this.getProp('metadata'), keypath);
    }

    /**
     * Set the value of metadata property at keypath.
     * @param keypath - The keypath of the metadata property to set.
     * @param value - The value to set.
     */
    setMetadata(keypath: string, value: any) {
        return this.setProp(`metadata.${keypath}`, value);
    }

    /**
     * Initialize the driver.
     */
    protected initDriver(): void {
        const driverConfig = this.getProp('driver');

        if (typeof driverConfig.type !== 'string') {
            this.logger.notice('No driver configured.');
            return;
        }

        const DriverModule = ExtensionController.findModule(DeviceDriver, driverConfig.type);
        this._driver = new DriverModule(this);

        if (this.getOption('recording.enabled') && this._driver!.manifest.get('recording.supported') !== true) {
            this.logger.warn(
                `Option 'recording.enabled' is set to true, but ${this._driver} does not support recording.`,
            );
        }
    }

    protected initRecordManager(): void {
        this._records = new RecordManager(this);
    }

    /**
     * Initializethe connection.
     */
    protected initConnector(): boolean {
        if (!this._driver) {
            throw new Error('Cannot initialize connection when no driver is initialized.');
        }

        let connConfig = this.getProp('connector');

        // Invoke the driver's modifyConnectionConfig() to edit the connection config.
        this.logger.debug('Calling device driver to edit the connection configuration.');
        const editedConnConfig = this._driver.modifyConnectorConfig(connConfig);

        if (typeof editedConnConfig?.type != 'string') {
            this.logger.notice('No connector configured.');
            return false;
        }

        const ConnectionModule = ExtensionController.findModule(DeviceConnector, editedConnConfig.type);
        const connection = new ConnectionModule(this, editedConnConfig);

        connection.on('create', () => {
            this.logger.debug('Connection created.');
            this._connection = connection;
            this.emitClientUpdate();

            this.emit('connection:create');
        });

        connection.on('destroy', () => {
            this.logger.debug('Connection destroyed.');
            this._connection = undefined;
            this.emitClientUpdate();

            this.emit('connection:destroy');
        });

        connection.on('open', () => {
            this.logger.debug('Connection open.');
            this.emitClientUpdate();

            this.emit('connection:open');
        });

        try {
            const result = connection.connect();
            if(result instanceof Promise) {
                result.catch(err => this.logger.error('Error connecting:', { err }));
            }
        } catch(err: any) {
            this.logger.error('Error connecting:', { err })
        }

        return true;

        // connector.invoke('connect', [ connConfig ]).then(connection: DeviceConnection => {
        //     this._connection = connection;

        //     // Add event listeners
        //     connection.on('open', () => this.logger.debug('Connection was opened.'));
        //     connection.on('close', () => this.logger.debug('Connection was closed.'));

        //     // Emit the 'connect' event
        //     this.emit('connect');
        // }).catch(err => {
        //     this.logger.error(err);
        // });
    }

    /**
     * Sends an update to the web client.
     */
    emitClientUpdate() {
        (async () => {
            WebSocket.emit('devices:change', {
                device: {
                    id: this.getId()
                }
            });
        })();
    }
}
