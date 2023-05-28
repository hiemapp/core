export default class ExtensionModuleNotRegisteredError extends Error {
    httpStatus: number;

    constructor(message: string) {
        super(message);
        this.name = 'ExtensionModuleNotRegisteredError';
        this.httpStatus = 500;
    }
}