import ExtensionModule from '../extensions/ExtensionModule';
import Device from './Device';
import type { DeviceProps } from './Device.types';

export default class DeviceConnector extends ExtensionModule {
    protected idOptionKey = 'id';
    protected config: DeviceProps['connector'];
    protected receivedData: any[] = [];
    protected device: Device;

    private _emittedCreateEvent: boolean = false;
    private _isOpen: boolean = false;
    get isOpen() {
        return this._isOpen;
    }

    constructor(device: Device, config: DeviceProps['connector']) {
        super();

        this.device = device;
        this.config = config;
    }

    /**
     * Initialize a connection.
     */
    connect(): void {
        throw new Error('Method connect() is not implemented.');
    }

    /**
     * Write data to the connection.
     * @param data - The data to write.
     */
    write(data: any) {
        throw new Error('Method write() is not implemented.');
    }

    /**
     * Write a file to the connection.
     * @param filepath - The path to the file to write.
     */
    file(filepath: string) {
        throw new Error('Method file() is not implemented.');
    }

    setSetting(name: string, value: any) {
        throw new Error('Method setSetting() is not implemented.');
    }

    /**
     * Read data that was received last.
     * @returns The data that was received.
     */
    read(): any[] {
        const data = Object.assign({}, this.receivedData);
        this.receivedData = [];
        return data;
    }

    /**
     * Should be called when a message is received.
     * @param message - The message that was received.
     */
    handleData(message: any) {
        super.emit('data', message);
        this.receivedData.push(message);
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
