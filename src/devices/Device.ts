import DeviceDriver from './DeviceDriver';
import ExtensionController from '../extensions/ExtensionController';
import ModelWithProps from '~/lib/ModelWithProps';
import DeviceController from './DeviceController';
import RecordManager from '../records/RecordManager';
import _ from 'lodash';
import type { DeviceType } from './Device.types';
import type { ModelWithPropsConfig } from '~/lib/ModelWithProps';
import type { ModelEventReason } from '~/lib/ModelEvent';
import { palettes } from '~/ui/constants/style';
import DeviceConnectionError from '~/errors/DeviceConnectionError';
import DeviceCommandNotSupportedError from '~/errors/DeviceCommandNotSupportedError';
import DeviceTrait from './DeviceTrait/DeviceTrait';
import { Constructor } from '~types/helpers';
import DeviceInvalidTraitError from '~/errors/DeviceInvalidTraitError';
import { Connector } from '~/connectors';
import DeviceDisplay from './DeviceDisplay';
import DeviceCommandParams from './DeviceTrait/DeviceCommandParams';
import { User } from '~/users';
import ConnectorController from '~/connectors/ConnectorController';

export default class Device extends ModelWithProps<DeviceType> {   
    __modelConfig(): ModelWithPropsConfig<DeviceType> {
        return {
            controller: DeviceController,
            filterProps: {
                name: false
            },
            dynamicProps: {
                connection: () => {
                    return {
                        isOpen: this.isConnected()
                    }
                },
                state: () => {
                    return this.getState();
                },
                display: () => {
                    return this.getDisplay();
                },
                traits: () => {
                    return this.getTraits().map(trait => trait.toJSON())
                }
            },
            defaults: {
                name: 'Unknown device',
                icon: 'circle-question',
                color: 'blue',
                driver: {
                    type: null,
                    options: {}
                },
                connectorId: null,
                options: {
                    recording: {
                        enabled: false,
                        cooldown: 5,
                        flushThreshold: 5
                    },
                    dummy: false,
                    pingInterval: 0
                },
                metadata: {}
            }
        }
    };

    get driver() { return this._driver };
    protected _driver: DeviceDriver;

    get connector() { return this._connector; }
    protected _connector: Connector;

    get records() { return this._records; }
    protected _records: RecordManager;

    protected hasConnector: boolean = false;

    async __init() {
        try {
            this.initDriver();
            this.initConnector();
            this.initPinger();

            this._driver.$module.methods.addDevice(this);

            await this.initRecordManager();

            if(!this.isConnected()) return;
        } catch (err: any) {
            this.logger.error('Initialization error:', err);
        }
    }

    getTrait<TTrait extends DeviceTrait<any>>(traitClass: Constructor<TTrait>): TTrait {
        const trait = this.getTraitOrFail(traitClass);

        if(!(trait instanceof traitClass)) {
            throw new DeviceInvalidTraitError(this, traitClass);
        }

        return trait;
    }

    getTraitOrFail<TTrait extends DeviceTrait<any>>(traitClass: Constructor<TTrait>): TTrait | null {
        return this.getTraits().find(trait => trait.getName() === traitClass.prototype.getName()) ?? null as any;
    }

    hasTrait(traitClass: Constructor<DeviceTrait<any>>) {
        return !!this.getTraitOrFail(traitClass);
    }

    getTraits(): DeviceTrait<any>[] {
        if(!this._driver) return [];
        return this._driver.getManifest(this).getArr('traits');
    }

    getName() {
        return this.getProp('name');
    }

    getPalette() {
        const color = this.getProp('color');
        const paletteId = typeof color === 'string' ? color.toUpperCase() : '';
        return palettes[paletteId as keyof typeof palettes] ?? palettes.BLUE;
    }

    getIcon() {
        return this.getProp('icon');
    }

    getState(): Record<string, unknown> {
        const traits = this.getTraits();
        let state = {};

        traits.forEach(trait => {
            const newState = trait.getState(this);

            // Later traits shoudn't overwrite the existing state
            state = {...newState, ...state};
        })

        return state;
    }

    getDisplay(user?: User) {
        let display = new DeviceDisplay(user);

        const traits = this.getTraits();
        traits.forEach(trait => {
            const result = trait.getDisplay(this, display);
            if(result instanceof DeviceDisplay) {
                display = result;
            }
        })

        return display.serialize();
    }

    getDriverConfig<TOptions extends Record<string, any>>() {
        return this.getProp('driver') as { type: string|null, options: TOptions };
    }

    isConnected() {
        if(!this._driver) return false;

        if(this.hasConnector) {
            if(!this._connector || !this._connector.isReady()) return false;
        }
        
        if(this._driver.$module.methods.hasProvider('checkConnection')) {
            if(this._driver.$module.methods.callProvider('checkConnection', [ this ]) !== true) {
                return false;
            }
        }
        
        return true;
    }

    async execute(command: string, paramsObj: any, reason?: ModelEventReason): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            this.logger.debug('Executing command', command, 'with params', paramsObj, 'and reason', reason ? reason.toString() : null);
            if(!this.isConnected()) {
                reject(new DeviceConnectionError(this));
                return;
            }

            const traits = this.getTraits();
            const trait = traits.find(trait => {
                const hasCommand = (typeof trait.commandRegistry[command] !== 'undefined')
                return hasCommand;
            })

            if(!trait) {
                reject(new DeviceCommandNotSupportedError(this));
                return;
            }

            // Store the old states so they can be reverted in case of an error.
            const oldStates: Array<[DeviceTrait<any>, any]> = traits.map(trait => {
                return [ trait, trait.getState(this) ]
            });

            const params = new DeviceCommandParams(paramsObj);
            
            try {
                this.emit('execute:start', { command, params });

                const traitHandler = trait.commandRegistry[command];
                if(typeof traitHandler === 'function') {
                    await traitHandler(this, params);
                }

                let driverResult: any;
                if(this.driver.$module.methods.hasProvider(`commands.${command}`)) {
                    driverResult = this.driver.$module.methods.callProvider(`commands.${command}`, [ this, params ]);
                }

                // The driver should perform calls to .setState() immediately,
                // so we can emit the update before awaiting the promise.
                this.emit('state:update', { reason: 'execute' });

                if(driverResult instanceof Promise) {
                    await driverResult;
                }

                this.emit('execute:done', { command, params, success: true });

                resolve();
            } catch(err: any) {
                // Revert the state of every trait
                oldStates.forEach(([ trait, oldState ]) => {
                    trait.setState(this, oldState, false);
                })

                this.emit('state:update', { reason: 'execute' });
                this.emit('execute:done', { command, params, success: false });

                this.logger.error(`Error executing command ${command}:`, err);

                reject(err);
            }
        })
    }

    // async setInput(name: string, value: any = null, reason: ModelEventReason = {}): Promise<void> {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             if(!this.isReady()) {
    //                 throw new Error('NOT_READY');
    //             }

    //             const input = this._driver.getManifest().getArr('inputs').find(i => i.name === name);
    //             if (!input) {
    //                 throw new Error('INPUT_NOT_FOUND');
    //             }

    //             this.logger.debug(`Setting input '${name}' to value ${value}.`);

    //             const inputEvent = this.createEvent('input', { name, value, reason });
    //             await inputEvent.emit();

    //             if (inputEvent.isCanceled) {
    //                 this.logger.debug('The input event was canceled.');
    //                 return resolve();
    //             }

    //             // const promise = this._driver.setInput(this, name, value)

    //             // if (promise instanceof Promise) {
    //             //     promise.catch(err => {
    //             //         reject(err instanceof Error ? err : new Error(err));
    //             //     })
    //             //     await promise;
    //             // }

    //             this.setMetadata(`state.inputs.${name}.value`, value);
    //             resolve();
    //         } catch (err: any) {
    //             return reject(err);
    //         }
    //     });
    // }

    /**
     * Get the value of an option.
     * @param keypath - The key of the option to get.
     * @param defaultValue - The default (fallback) value.
     * @returns The value of the option.
     */
    getOption(keypath: string, defaultValue: any = null) {
        return _.get(this.getProp('options'), keypath) ?? defaultValue;
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
     * Initialize the device's pinger.
     * 
     * Drivers and connectors can listen to a device's ping event to
     * periodically request the current value from a sensor and update
     * the device's state.
     */
    protected initPinger(): void {
        const pingInterval = this.getOption('pingInterval');

        if(typeof pingInterval === 'number' && pingInterval > 0) {  
            this.emit('ping', {});

            setInterval(() => {
                this.emit('ping', {});
            }, pingInterval*1000);

            this.logger.debug(`Pinger initialized to run every ${pingInterval}s.`);
        }
    }

    /**
     * Initialize the driver.
     */
    protected initDriver(): boolean {
        const driverConfig = this.getDriverConfig();

        if (typeof driverConfig?.type !== 'string') {
            this.logger.notice('No driver configured.');
            return false;
        }

        this._driver = ExtensionController.findModule(DeviceDriver, driverConfig.type);

        return true;
    }

    protected async initRecordManager(): Promise<void> {
        this._records = new RecordManager(this);
        await this._records.init();
    }

    /**
     * Initialize the connector.
     */
    protected initConnector() { 
        const connectorId = this.getProp('connectorId');
        if(!connectorId) {
            this.logger.notice('No connector specified.');
            return false;
        }

        this._connector = ConnectorController.find(connectorId);    

        if(!this.connector.isInitialized()) {
            // Get the connectors's default protocol config
            let protocolConfig = this.connector.getProp('protocol');

            // Allow the driver to modify the protocol config
            if(this.driver.$module.methods.hasProvider('getProtocolConfig')) {
                this.connector.logger.debug(`Getting protocol config from ${this.driver} (from ${this}).`);
                protocolConfig = this.driver.$module.methods.callProvider('getProtocolConfig', [ this, protocolConfig ]);
            }

            if (typeof protocolConfig?.type !== 'string') {
                this.logger.notice('No protocol config specified.');
                return false;
            }
            
            // Initialize the connector with the new protocol config
            this.connector.initialize(protocolConfig);

            // Let the driver know that there is a new connector
            this.driver.emit('connectors:add', this.connector);
        }

        this.logger.debug('Connector initialized.');
    }
}
