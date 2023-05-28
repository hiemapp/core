import Model, { ModelConfig } from '../lib/Model';
import { logger } from './Logger';
import { PromiseAllObject } from '../utils/Promise';
import _ from 'lodash';

export interface ModelWithPropsConfig<
    TProps, TPropsSerialized
> extends ModelConfig {
    dynamicProps?: {
        [K in keyof TPropsSerialized]?: () => TPropsSerialized[K]
    },
    filterProps?: {
        [key in keyof TPropsSerialized]?: (boolean | (() => boolean))
    },
    controller: any;
    defaults: Required<Omit<TProps, 'id'>>;
}

abstract class ModelWithProps<
    TProps extends { id: number | string } = { id: number }, 
    TPropsSerialized extends TProps = TProps
> extends Model<TProps['id']> {
    abstract _getConfig(): ModelWithPropsConfig<TProps, TPropsSerialized>;

    readonly _cnf: ModelWithPropsConfig<TProps, TPropsSerialized>;
    private _props: TProps = {} as TProps;

    constructor(id: TProps['id'], props: Omit<TProps, 'id'>) {
        super(id);
        this._cnf = this._getConfig();
        this._props = _.defaultsDeep(props, this._cnf.defaults);

        this.init();
    }

    protected init() {}

    /**
     * Get all properties of the model.
     * @returns A copy of the properties of the model.
     */
    getProps(filter = false): Partial<TProps> {
        const propsClone = {...this._props, id: this._id};
        const omitKeypaths: string[] = [];

        if(filter && this._cnf.filterProps) {
            _.forOwn(this._cnf.filterProps, (handler, keypath) => {
                let exclude: boolean = !!handler;

                if(typeof handler === 'function') {
                    exclude = !!handler();
                }

                if(exclude) {
                    omitKeypaths.push(keypath);
                }
            })
        }

        if (omitKeypaths.length) {
            return _.omit(propsClone, omitKeypaths) as Partial<TProps>;
        }

        return propsClone as TProps;
    }

    /**
     * Get a specific property by keypath.
     * @param keypath The keypath of the property to get.
     */
    getProp<TKey extends keyof TProps>(keypath: TKey): TProps[TKey];
    getProp(keypath: string): any;
    getProp(keypath: string) {
        return _.get(this.getProps(), keypath);
    }

    /**
     * Set a specific property by keypath.
     * @param keypath The keypath of the property to set.
     * @param value The value to set the property to.
     */
    setProp<TKey extends keyof TProps>(keypath: TKey, value: any): this;
    setProp(keypath: string, value: any): this;
    setProp(keypath: string, value: any) {
        // Mutate model properties
        _.set(this._props, keypath, value);

        // Update the controller
        const controller = this._cnf.controller;
        if (this.getId() && typeof controller.update === 'function') {
            controller.update(this.getId(), this);
        }

        return this;
    }

    addDynamicPropsSync(props: Partial<TProps>): Partial<TPropsSerialized> {
        const anyProps = props as any;

        if (this._cnf.dynamicProps) {
            _.forOwn(this._cnf.dynamicProps, (handler, key) => {
                if(typeof handler !== 'function') return true;
                anyProps[key] = handler();
            })
        }

        return anyProps as Partial<TPropsSerialized>;
    }

    async addDynamicProps(props: Partial<TProps>): Promise<Partial<TPropsSerialized>> {
        const dynamicPropsSync = this.addDynamicPropsSync(props);
        return await PromiseAllObject(dynamicPropsSync);
    }


    toJSON() {
        return this.addDynamicPropsSync(this.getProps(false));
    }

    async serialize() {
        return await this.addDynamicProps(this.getProps(false));
    }
}

export default ModelWithProps;
