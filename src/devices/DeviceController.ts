import ControllerDatabase from '../lib/ControllerDatabase';
import Device from './Device';

export default class DeviceController extends ControllerDatabase<Device>() {
    static table = 'devices';

    static load() {
        return super.load(Device);
    }
}
