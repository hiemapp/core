import Script from './Script';

export default class ScriptContext {
    protected static _currentScript: Script;

    static getScript(): Script {
        return this._currentScript;
    }
}