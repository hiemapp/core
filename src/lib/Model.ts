import * as _ from 'lodash';
import Logger, { logger } from './Logger';
import ModelEvent from './ModelEvent';

export type InferModelType<TModel> = TModel extends Model<infer T> ? T : never;
export type EventName<TModel> = keyof InferModelType<TModel>['events'] & string;
export type EventData<TModel, TEventName extends keyof InferModelType<TModel>['events']> = InferModelType<TModel>['events'][TEventName];

export interface ModelConfig {
    maxListeners?: number;
}

export interface ModelType {
    id: string | number;
    events: {}
}

export interface ModelEventListener {
    callback: ((data: any) => unknown);
    options?: ModelEventListenerOptions
}

export interface ModelEventListenerOptions {
    /** Listeners with the duplicate keys are ignored, and won't be added. */
    key?: any
}

abstract class Model<T extends ModelType> {
    protected __modelId: T['id'];
    protected __modelConfig(): ModelConfig { return {}; };

    private __eventListeners: Record<string, ModelEventListener[] | undefined> = {};
    get id() { return this.__modelId };

    logger: Logger;

    constructor(id: T['id']) {
        this.__modelId = id;
        this.logger = logger.child({ label: this.toString() });
    }

    once<TEventName extends keyof T['events'] & string>(eventName: TEventName, callback: (data: T['events'][TEventName]) => unknown, options?: ModelEventListenerOptions) {
        const wrapper = (data: any) => {
            this.off(eventName, wrapper);
            callback(data);
        }
        
        this.on(eventName, wrapper, options);
    }

    on<TEventName extends keyof T['events'] & string>(eventName: TEventName, callback: (data: T['events'][TEventName]) => unknown, options?: ModelEventListenerOptions): boolean {
        this.__eventListeners[eventName] ??= [];

        // Compare the key of the new listener with that of the existing listeners. If
        // a listener with the same key already exists, then don't add the new listener.
        if(typeof options?.key !== 'undefined') {
            if(this.__eventListeners[eventName]!.some(l => l.options?.key === options?.key)) {
                return false;
            }
        }

        this.__eventListeners[eventName]!.push({ callback, options });
        return true;
    }
    
    off<TEventName extends keyof T['events'] & string>(eventName: TEventName, callback: (data: T['events'][TEventName]) => unknown) {
        if(this.__eventListeners[eventName]) {
            const oldLength = this.__eventListeners[eventName]!.length;
            this.__eventListeners[eventName] = this.__eventListeners[eventName]!.filter(l => l.callback !== callback);
            const newLength = this.__eventListeners[eventName]!.length;
            return oldLength !== newLength;
        }

        return false;
    }

    emit<TEventName extends keyof T['events'] & string>(eventName: TEventName, data: T['events'][TEventName]) {
        const event = this.createEvent(eventName, data);
        return event.emit();
    }

    protected createEvent<TEventName extends keyof T['events']>(eventName: TEventName, data: T['events'][TEventName]) {
        return new ModelEvent<T['events'][TEventName] & {}>(this, this.__eventListeners[eventName] ?? [], eventName as string, data as any);
    }
    
    /**
     * Convert the model to a string.
     */
    toString(): string {
        const type = this.constructor.name;
        return this.id ? `[${type} ${this.id}]` : `[${type}]`;
    }

    /**
     * Convert the model to JSON.
     */
    toJSON(): any {
        return { id: this.id };
    }
}

export default Model;
