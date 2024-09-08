import { Device_SA } from '~/scripts/api/devices/Device.script-api';
import { ApiControllerModule } from '~/scripts/api/lib/ApiControllerModule';

class DevicesModule extends ApiControllerModule<Device_SA> {
    /**
     * Get a device by id.
     * @param id The id of the device.
     * @returns The device.
     */
    get(id: number) { return super.get(id); }

    /**
     * Get a list of all device.
     * @returns The devices.
     */
    list() { return super.list(); }

    /**
     * Get a device by name.
     * @param name The name of the device.
     * @returns The device.
     */
    getByName(name: string) {
        const device = super.list().find(d => d.name.toLowerCase().trim() === name.toLowerCase().trim());
        if(device) return device;

        throw new Error(`Cannot find device by name '${name}'.`);
    }
}

export { DevicesModule as DevicesModule_SA }