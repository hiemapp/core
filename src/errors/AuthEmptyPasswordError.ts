import { icons } from '~/ui';
import CustomError from './CustomError';

export default class AuthEmptyPasswordError extends CustomError {
    constructor() {
        super({
            message: 'Password can not be empty.',
            status: 400,
            icon: icons.KEY
        })
    }
}