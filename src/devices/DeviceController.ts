import DatabaseController from '../lib/DatabaseController';
import Device from './Device';

export default class DeviceController extends DatabaseController<Device>() {
    static table = 'devices';

    static load() {
        return super.load(Device);
    }
}
