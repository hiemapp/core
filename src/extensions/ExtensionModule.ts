import Manifest from '~/utils/Manifest';
import { logger } from '~/lib/Logger';
import Extension from './Extension';
import _ from 'lodash';
import TypedEventEmitter from '~/utils/TypedEventEmitter';
import { Constructor } from '~types/helpers';
import { resolveExtensionFromStack, resolveExtensionModuleType } from './utils';

export type ExtensionModuleName = string;

export interface ExtensionModuleConfig {
    manifestRequired?: boolean
}

export interface ExtensionModuleMeta<T extends TExtensionModule> {
    id: string;
    extension: Extension;
    name: string;
    isActivated: boolean;
    type: Constructor<ExtensionModule>;
    methods: T['methods'] & {
        callProvider: ExtensionModule['_callProvider'];
        hasProvider: ExtensionModule['_hasProvider'];
        register: ExtensionModule['_register'];
    }
    providers: Record<keyof T['providers'], ExtensionModuleProviderFunction>;
}

export interface TExtensionModule {
    events: Record<string, any>;
    methods: {},
    providers: {
        init: () => unknown,
        [key: string]: (...args: any[]) => any
    }
}

export interface ExtensionModuleOptions<T extends TExtensionModule, TData extends {}> {
    initialData?: Partial<TData>
}

export type ExtensionModuleProvider<T extends TExtensionModule, P extends keyof T['providers']> =
    T['providers'][P] extends (...args: any[]) => any
        ? T['providers'][P] | ReturnType<T['providers'][P]> 
        : never;

export type ExtensionModuleProviderFunction<T extends TExtensionModule = any, P extends keyof T['providers'] = any> =
    T['providers'][P] extends (...args: any[]) => any
        ? T['providers'][P] 
        : never;

export type ExtensionModuleProviderResult<T extends TExtensionModule, P extends keyof T['providers']> =
    T['providers'][P] extends (...args: any[]) => any ? ReturnType<T['providers'][P]> : never;

export default class ExtensionModule<T extends TExtensionModule = TExtensionModule, TData extends {} = {}> extends TypedEventEmitter<T['events']> {
    logger = logger.child({ label: this.constructor.name });
    data: TData = {} as TData;

    $module: ExtensionModuleMeta<T> = {
        methods: {},
        providers: {},
        activated: false
    } as any;

    constructor(name: string, options: ExtensionModuleOptions<T, TData> = {}) {
        super();

        if (options.initialData) {
            this.data = options.initialData as TData;
        }

        this.$module.name = name;

        this.$module.methods.callProvider = this._callProvider.bind(this);
        this.$module.methods.hasProvider = this._hasProvider.bind(this);
        this.$module.methods.register = this._register.bind(this);

        this._init();
        this._register();
    }

    protected _init() {};

    set activate(activate: ExtensionModuleProviderFunction<T, 'activate'>) {
        this._registerProvider('activate', activate);
    }

    setManifest(manifest: ExtensionModuleProvider<T, 'manifest'>) {
        this._registerProvider('manifest', manifest);
    }

    getManifest(...args: Parameters<T['providers']['manifest']>) {
        const manifest = this._callProvider('manifest', args);
        return new Manifest<ExtensionModuleProviderResult<T, 'manifest'>>(manifest);
    }
    
    protected _registerProvider<P extends keyof T['providers'] & string>(id: P, provider: ExtensionModuleProvider<T, P>) {
        if(id !== 'activate' && !this.$module.isActivated) {
            throw new Error(`Cannot register provider '${id}' outside of the module.activate() method.`);
        }
        
        if (this.$module.providers[id]) {
            throw new Error(`A provider '${id}' is already registered.`);
        }

        const providerFunc = (typeof provider === 'function' ? provider : () => provider);
        this.$module.providers[id] = providerFunc;
    }

    protected _callProvider<P extends keyof T['providers'] & string>(id: P, args: any[]): ExtensionModuleProviderResult<T, P> {
        if (!this._hasProvider(id)) {
            throw new Error(`No provider '${id}' was registered inside ${this.constructor.name} '${this.$module.name}'.`);
        }

        return this.$module.providers[id](...args);
    }

    protected _hasProvider<P extends keyof T['providers'] & string>(id: P) {
        return typeof this.$module.providers[id] === 'function';
    }

    protected async _register() {
        const extension = resolveExtensionFromStack();

        try {
            const moduleType = resolveExtensionModuleType(this);

            // Generate module id
            const moduleId = `${extension.id}.${this.$module.name}`

            // Update module.$module property
            this.$module = {
                ...this.$module,
                extension: extension,
                id: moduleId,
                type: moduleType
            }

            // Register the module
            extension.registerModule(this);
        } catch (err: any) {
            extension.logger.error(`Error registering ${this}:`, err);
        }
    }

    toString() {
        return `[${this.$module.type.name} ${this.$module.id}]`;
    }
}
