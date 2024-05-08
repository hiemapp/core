import type { Device as IDevice } from '~types/scripts/ScriptApi';
import type { DeviceType } from '~/devices/Device.types';
import type Device from '~/devices/Device';
import ModelWrapper from './ModelWrapper';

export default class DeviceWrapper extends ModelWrapper<Device, DeviceType> implements IDevice {
    getName() { return this.model.getProp('name'); }
    getIcon() { return this.model.getProp('icon'); }
    
    getState() { return this.model.getDynamicProp('state'); }
    performInput(name: string, value: any) { return this.model.performInput(name, value) };
    async getSensorData() { 
        if(!this.model.connection || !this.model.connection.isReady()) return null;
        return await this.model.connection.read();
    };
}