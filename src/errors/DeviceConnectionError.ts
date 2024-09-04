import { icons } from '~/ui';
import CustomError from './CustomError';
import Device from '~/devices/Device';

export default class DeviceConnectionError extends CustomError {
    constructor(device: Device) {
        super({
            message: `No connection with ${device}.`,
            ctx: { device },
            status: 500,
            icon: icons.WIFI_SLASH
        })
    }
}