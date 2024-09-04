import { icons } from '~/ui';
import CustomError from './CustomError';

export default class AuthEmptyUsernameError extends CustomError {
    constructor() {
        super({
            message: 'Username can not be empty.',
            status: 400,
            icon: icons.KEY
        })
    }
}