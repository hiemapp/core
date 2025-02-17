import CustomError from './CustomError';
import Device from '~/devices/Device';
import { ModelWithProps } from '~/lib';

export default class PermissionManageError extends CustomError {
    constructor(model: ModelWithProps<any>) {
        super({
            message: `You're not allowed to manage ${model}.`,
            status: 403,
            ctx: { model }
        })
    }
}