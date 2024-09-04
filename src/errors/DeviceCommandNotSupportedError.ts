import CustomError from './CustomError';
import Device from '~/devices/Device';

export default class DeviceCommandNotSupportedError extends CustomError {
    constructor(device: Device) {
        super({
            message: `${device} does not support this command.`,
            ctx: { device },
            status: 405
        })
    }
}