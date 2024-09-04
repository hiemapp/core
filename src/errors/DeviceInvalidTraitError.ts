import CustomError from './CustomError';
import Device from '~/devices/Device';

export default class DeviceInvalidTraitError extends CustomError {
    constructor(device: Device, traitClass: any) {
        super({
            message: `${device} has no trait '${traitClass?.name}'.`,
            ctx: { device },
            status: 500
        })
    }
}