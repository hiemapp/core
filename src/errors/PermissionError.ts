import CustomError from './CustomError';
import Device from '~/devices/Device';
import { ModelWithProps } from '~/lib';

export default class PermissionError extends CustomError {
    constructor(model: ModelWithProps<any>) {
        super({
            message: `You don't have permission to perform this action on ${model}.`,
            status: 403,
            ctx: { model }
        })
    }
}