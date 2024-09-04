import CustomError from './CustomError';
import Device from '~/devices/Device';

export default class DeviceInvalidCommandError extends CustomError {
    constructor(device: Device) {
        super({
            message: `${device} has no trait with this command.`,
            ctx: { device },
            status: 400
        })
    }
}