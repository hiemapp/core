class ExtensionNotInstalledError extends Error {
    httpStatus: number;

    constructor(extensionId: string) {
        super(`Extension '${extensionId}' is not installed.`);
        this.name = 'ExtensionNotInstalledError';
        this.httpStatus = 500;
    }
}

export default ExtensionNotInstalledError;