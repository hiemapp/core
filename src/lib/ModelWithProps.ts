import Model, { ModelType } from '../lib/Model';
import { PromiseAllObject } from '../utils/Promise';
import _ from 'lodash';
import z, { ZodObject } from 'zod';
import { ControllerType } from './Controller';
import { getDefaults } from '~/utils/zod';
import { defaultsDeepNull } from '~/utils';

// @ts-ignore (protected property)
export type InferSchema<T extends ModelWithProps> = z.infer<T['$schema']>;

export type DynamicProps<T extends ModelWithProps> = Partial<{
    [K in keyof InferSchema<T>]: () => InferSchema<T>[K]
}>;


abstract class ModelWithProps<T extends ModelType = any> extends Model<T> {
    protected $schema: z.ZodSchema;
    protected $dynamicProps: DynamicProps<ModelWithProps> = {};
    protected $props: InferSchema<this>;

    protected _defaultProps: InferSchema<this>;
    
    constructor(id: T['id']) {
        super(id);
    }

    __init(): void | Promise<void> {}

    static fromProps(this: any, id: any, props: any) {
        const resource = new this(id);

        if(!(resource.$schema instanceof ZodObject)) {
            throw new Error(`No '$schema' property defined on model '${resource.constructor.name}'.`)
        }

        resource.$props = props;
        resource._defaultProps = getDefaults(resource.$schema);

        return resource;
    }

    /**
     * Get all properties of the model.
     * @returns A copy of the properties of the model.
     */
    getProps(): InferSchema<this> & { id: T['id'] } {
        const propsWithDefaults = defaultsDeepNull({...this.$props}, this._defaultProps);
        return {...propsWithDefaults, id: this.$id };
    }

    async getAllProps() {
        const props = this.getProps();
        const dynamicProps = await PromiseAllObject(_.mapValues(this.$dynamicProps, (_, key) => this.getDynamicProp(key)));
        
        return { ...props, ...dynamicProps };
    }

    /**
     * Get a specific property by keypath.
     * @param keypath The keypath of the property to get.
     */
    getProp<TKey extends keyof InferSchema<this>>(keypath: TKey): InferSchema<this>[TKey];
    getProp(keypath: string): any;
    getProp(keypath: string) {
        return _.get(this.getProps(), keypath);
    }

    isDynamicProp<TKey extends keyof InferSchema<this>>(keypath: TKey): boolean;
    isDynamicProp(keypath: string): boolean;
    isDynamicProp(keypath: string) {
        const key = keypath.split('.')[0] as keyof InferSchema<this>; 
        return typeof this.$dynamicProps[key] === 'function';
    }

    async getDynamicProp<TKey extends keyof InferSchema<this>>(keypath: TKey): Promise<InferSchema<this>[TKey]>;
    async getDynamicProp(keypath: string): Promise<any>;
    async getDynamicProp(keypath: string) {
        const splitKeypath = keypath.split('.');
        const key = splitKeypath[0] as keyof InferSchema<this>;
        const rest = splitKeypath.slice(1).join('.');

        const handler = this.$dynamicProps[key];
        if(typeof handler !== 'function') return null;

        const value = await handler();
        return rest ? _.get(value, rest) : value;
    }

    /**
     * Set a specific property by keypath.
     * @param keypath The keypath of the property to set.
     * @param value The value to set the property to.
     */
    setProp<TKey extends keyof InferSchema<this>>(keypath: TKey, value: any): this;
    setProp(keypath: string, value: any): this;
    setProp(keypath: string, value: any) {
        // Mutate model properties
        _.set(this.$props, keypath, value);

        // Update the controller
        const controller: ControllerType = (this.constructor as any).$controller;
        if (typeof controller?.update === 'function') {
            controller.update(this);
        }

        return this;
    }

    toJSON() {
        return this.getProps();
    }
}

export default ModelWithProps;
