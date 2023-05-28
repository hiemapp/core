import Model from '../lib/Model';

export type ExtensionModuleName = string;

class ExtensionModule extends Model<string> {
    constructor() {
        super('');
    }
}

export default ExtensionModule;
