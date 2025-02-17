import CustomError from './CustomError';
import Device from '~/devices/Device';
import { ModelWithProps } from '~/lib';

export default class PermissionViewError extends CustomError {
    constructor(model: ModelWithProps<any>) {
        super({
            message: `You're not allowed to view ${model}.`,
            status: 403,
            ctx: { model }
        })
    }
}