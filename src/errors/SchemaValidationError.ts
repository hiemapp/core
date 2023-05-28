class SchemaValidationError extends Error {
    httpStatus: number;

    constructor(ajvErrorObject: any) {
        const err = ajvErrorObject[0];
        
        super(err.message+': '+ err.instancePath);
        this.name = 'SchemaValidationError';
        this.httpStatus = 500;
    }
}

export default SchemaValidationError;