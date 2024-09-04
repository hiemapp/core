import { icons } from '~/ui';
import CustomError from './CustomError';

export default class AuthIncorrectCredentialsError extends CustomError {
    constructor() {
        super({
            message: 'Incorrect username or password.',
            status: 400,
            icon: icons.KEY
        })
    }
}