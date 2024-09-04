import CustomError from './CustomError';
import Device from '~/devices/Device';

export default class DeviceInvalidInputError extends CustomError {
    constructor(device: Device, input: any) {
        super({
            message: `${device} has no input named '${input}'.`,
            ctx: { device },
            status: 400
        })
    }
}