import Script from '~/scripts/Script';
import { Constructor } from '~types/helpers';

export type IApiStaticModule<TFactory extends () => any> = TFactory extends () => infer TModule ? TModule: unknown;

class ApiModule {
    static $script: Script;
    get $script(): Script { return (this.constructor as any).$script }

    static _init(script: Script) {
        this.$script = script;
    }
}

export { ApiModule as ApiModule_SA };