import ValueAsserter from '~/lib/ValueAsserter';

export default class DeviceCommandParams<TParams extends Record<string, any> = {}> {
    protected params;

    constructor(params: TParams) {
        this.params = params ?? {};
    }

    has(param: keyof TParams): boolean {
        const value = this.get(param);
        return typeof value !== 'undefined' && value !== null;
    }

    get<TKey extends keyof TParams>(param: TKey): TParams[TKey] {
        return this.params[param];
    }

    getBool<TKey extends keyof TParams>(param: TKey): boolean {
        return !!this.get(param);
    }

    getNumber<TKey extends keyof TParams>(param: TKey): number {
        return parseFloat(this.get(param));
    }

    getString<TKey extends keyof TParams>(param: TKey): string {
        return this.get(param)+'';
    }

    set<TKey extends keyof TParams>(param: TKey, value: TParams[TKey]) {
        this.params[param] = value;
        return this.get(param);
    }

    // assert(param: keyof TParams) {
    //     return ValueAsserter.assert(this.params[param]);
    // }
}