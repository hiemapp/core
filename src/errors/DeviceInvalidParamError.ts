import CustomError from './CustomError';
import Device from '~/devices/Device';

export default class DeviceInvalidParamError extends CustomError {
    constructor(device: Device, params: Record<string, any>) {
        super({
            message: `Invalid parameter(s) for this command on ${device}: ${JSON.stringify(params)}.`,
            ctx: { device },
            status: 400
        })
    }
}