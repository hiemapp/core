import Model from '../lib/Model';

export type ExtensionModuleName = string;

abstract class ExtensionModule extends Model<string> {
    constructor() {
        super('');
    }
}

export default ExtensionModule;
