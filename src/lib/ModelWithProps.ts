import Model, { ModelConfig } from '../lib/Model';
import { PromiseAllObject } from '../utils/Promise';
import _, { split } from 'lodash';

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
    protected __modelProps: TProps = {} as TProps;
    protected abstract __modelConfig(): ModelWithPropsConfig<TProps, TPropsSerialized>;

    constructor(id: TProps['id'], props: Omit<TProps, 'id'>) {
        super(id);
        const config = this.__modelConfig();

        this.__modelProps = _.defaultsDeep(props, config.defaults);
        
        this.init();
    }

    protected init(): void {};

    /**
     * Get all properties of the model.
     * @returns A copy of the properties of the model.
     */
    getProps(): TProps {
        return {...this.__modelProps, id: this.__modelId } as TProps;
    }

    async getAllProps() {
        const props = this.getProps();
        const config = this.__modelConfig();

        if (!config.dynamicProps) {
            return props;
        }
    
        const dynamicProps = await PromiseAllObject(_.mapValues(config.dynamicProps, (handler, key) => {
            if(typeof handler !== 'function') return true;
            return handler();
        }));
        
        return { ...props, ...dynamicProps };
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

    async getDynamicProp<TKey extends keyof TPropsSerialized>(keypath: TKey): Promise<TPropsSerialized[TKey]>;
    async getDynamicProp(keypath: string): Promise<any>;
    async getDynamicProp(keypath: string) {
        const splitKeypath = keypath.split('.');
        const key = splitKeypath[0] as keyof TPropsSerialized;
        const rest = splitKeypath.slice(1).join('.');

        const handler = this.__modelConfig().dynamicProps?.[key];
        if(typeof handler !== 'function') return null;

        const value = await handler();
        return _.get(value, rest);
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
        _.set(this.__modelProps, keypath, value);

        // Update the controller
        const controller = this.__modelConfig().controller;
        if (this.getId() && typeof controller.update === 'function') {
            controller.update(this.getId(), this);
        }

        return this;
    }

    toJSON() {
        return this.getProps();
    }

    async serialize() {
        return await this.getAllProps();
    }
}

export default ModelWithProps;
