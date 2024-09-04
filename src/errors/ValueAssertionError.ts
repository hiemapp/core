import CustomError from './CustomError';

export default class ValueAssertionError extends CustomError {
    constructor(message: string) {
        super({
            message: message,
            status: 400
        })
    }
}