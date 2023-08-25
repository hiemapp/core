import Device from './Device';
import type { DeviceProps } from './Device.types';
import { ExtensionModuleFactory } from '~/extensions/ExtensionModule';
import Manifest from '~/utils/Manifest';

export default class DeviceConnector<TSettings extends {} = {}> extends ExtensionModuleFactory<any>() {
    protected idOptionKey = 'id';
    protected config: DeviceProps['connector'];
    protected device: Device;
    private _emittedCreateEvent: boolean = false;

    private _isOpen: boolean = false;
    get isOpen() {
        return this._isOpen;
    }

    private _settings: Manifest<TSettings>;
    get settings() {
        return this._settings;
    }

    constructor(device: Device, config: DeviceProps['connector']) {
        super();

        this.device = device;
        this.config = config;
    }

    /**
     * Initialize a connection.
     */
    connect(): void | Promise<void> {
        throw new Error('Method connect() is not implemented.');
    }

    /**
     * Write data to the connection.
     * @param data - The data to write.
     */
    write(data: unknown) {
        throw new Error('Method write() is not implemented.');
    }

    isReady(action?: 'WRITE' | 'READ'): boolean {
        switch(action) {
            case 'WRITE':
                return this._isOpen;
            case 'READ':
                return this._isOpen;
            default:
                return this.isReady('WRITE') && this.isReady('READ');
        }
    }

    /**
     * Write a file to the connection.
     * @param filepath - The path to the file to write.
     */
    file(filepath: string) {
        throw new Error('Method file() is not implemented.');
    }

    defineDefaultSettings(defaultSettings: TSettings) {
        this._settings = new Manifest(defaultSettings);
    }

    /**
     * Should be called when data is received.
     * @param data - The data that was received.
     */
    handleData(data: any) {
        super.emit('data', data);
    }

    /**
     * Enables writing to the connection.
     */
    emit(event: string, ...args: any[]): boolean {
        switch (event) {
            case 'create':
                this._emittedCreateEvent = true;
                super.emit('create');
                break;

            case 'destroy':
                this._emittedCreateEvent = false;
                this._isOpen = false;
                super.emit('destroy');
                break;

            case 'open':
                if (!this._emittedCreateEvent) {
                    this.logger.error(new Error(`Cannot emit an 'open' event before emitting a 'create' event.`));
                    break;
                }

                this._isOpen = true;
                super.emit('open');
                break;

            case 'data':
                super.emit('data', ...args);
                break;

            default:
                this.logger.warn(`Cannot emit unrecognized event '${event}'.`);
        }

        return true;
    }
}
