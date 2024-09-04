import { defaultsDeepNull } from '~/utils/object';
import Model, { ModelType, ModelConfig } from '../lib/Model';
import { PromiseAllObject } from '../utils/Promise';
import _ from 'lodash';

export interface ModelWithPropsType extends ModelType {
    props: {},
    serializedProps: {}
}

export interface ModelWithPropsConfig<T extends ModelWithPropsType> extends ModelConfig {
    dynamicProps?: {
        [K in keyof T['serializedProps']]?: () => T['serializedProps'][K]
    },
    filterProps?: {
        [key in keyof (T['props'] & T['serializedProps'])]?: (boolean | (() => boolean))
    },
    controller: any;
    defaults: Required<Omit<T['props'], 'id'>>;
}

abstract class ModelWithProps<T extends ModelWithPropsType> extends Model<T> {
    protected __modelProps: T['props'] = {} as T['props'];
    protected abstract __modelConfig(): ModelWithPropsConfig<T>;

    constructor(id: T['id'], props: Partial<Omit<T['props'], 'id'>>) {
        super(id);
        const config = this.__modelConfig();

        this.__modelProps = defaultsDeepNull(props, config.defaults);
    }

    __init(): void | Promise<void> {}

    /**
     * Get all properties of the model.
     * @returns A copy of the properties of the model.
     */
    getProps(): T['props'] & { id: T['id'] } {
        return {...this.__modelProps, id: this.__modelId };
    }

    async getAllProps() {
        const props = this.getProps();
        const config = this.__modelConfig();

        if (!config.dynamicProps) {
            return props;
        }
    
        const dynamicProps = await PromiseAllObject(_.mapValues(config.dynamicProps, (func, prop) => this.getDynamicProp(prop)));
        
        return { ...props, ...dynamicProps };
    }

    /**
     * Get a specific property by keypath.
     * @param keypath The keypath of the property to get.
     */
    getProp<TKey extends keyof T['props']>(keypath: TKey): T['props'][TKey];
    getProp(keypath: string): any;
    getProp(keypath: string) {
        return _.get(this.getProps(), keypath);
    }

    isDynamicProp<TKey extends keyof T['serializedProps']>(keypath: TKey): boolean;
    isDynamicProp(keypath: string): boolean;
    isDynamicProp(keypath: string) {
        const key = keypath.split('.')[0] as keyof T['serializedProps']; 
        const handler = this.__modelConfig().dynamicProps?.[key];
        return typeof handler === 'function';
    }

    async getDynamicProp<TKey extends keyof T['serializedProps']>(keypath: TKey): Promise<T['serializedProps'][TKey]>;
    async getDynamicProp(keypath: string): Promise<any>;
    async getDynamicProp(keypath: string) {
        const splitKeypath = keypath.split('.');
        const key = splitKeypath[0] as keyof T['serializedProps'];
        const rest = splitKeypath.slice(1).join('.');

        const handler = this.__modelConfig().dynamicProps?.[key];
        if(typeof handler !== 'function') return null;

        const value = await handler();
        return rest ? _.get(value, rest) : value;
    }

    /**
     * Set a specific property by keypath.
     * @param keypath The keypath of the property to set.
     * @param value The value to set the property to.
     */
    setProp<TKey extends keyof T['props']>(keypath: TKey, value: any): this;
    setProp(keypath: string, value: any): this;
    setProp(keypath: string, value: any) {
        // Mutate model properties
        _.set(this.__modelProps, keypath, value);

        // Update the controller
        const controller = this.__modelConfig().controller;
        if (this.id && typeof controller?.update === 'function') {
            controller.update(this.id, this);
        }

        return this;
    }

    toJSON() {
        return this.getProps();
    }
}

export default ModelWithProps;
