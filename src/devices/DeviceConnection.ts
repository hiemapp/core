import Model, { ModelType } from '~/lib/Model';
import { Connector } from '..';
import Device from './Device';

export interface DeviceConnectionType extends ModelType {
    events: {
        'open': void,
        'close': void
    }
}

export default class DeviceConnection extends Model<DeviceConnectionType> {
    get connector() { return this._connector; }
    protected _connector: Connector;

    get device() { return this._device; }
    protected _device: Device;
    
    protected _isOpen: boolean = false;
    
    constructor(device: Device, connector: Connector) {
        super(device.id);

        this._device = device;
        this._connector = connector;
    }

    isOpen() {
        return this._isOpen;
    }

    setOpen(isOpen: boolean = true) {
        isOpen = !!isOpen;
        if(this._isOpen === isOpen) return;

        this._isOpen = isOpen;
        this.logger.debug(`Connection ${isOpen ? 'opened' : 'closed'}.`);
        this.emit(isOpen ? 'open' : 'close', undefined);
    }

    write(data: unknown) {
        this.connector.send(data);
    }
}