import CustomError from './CustomError';
import Device from '~/devices/Device';

export default class DeviceCommandExecutionError extends CustomError {
    constructor(device: Device) {
        super({
            message: `Something went wrong with ${device} while executing this command.`,
            status: 500,
            ctx: { device }
        })
    }
}