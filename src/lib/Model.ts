import * as _ from 'lodash';
import Logger, { logger } from './Logger';
import ModelEvent, { ModelEventData, type ModelEventCallback } from './ModelEvent';

export interface ModelConfig {
    maxListeners?: number;
}

export interface ModelType {
    id: string | number;
    events: Record<string, { data?: any }>
}

abstract class Model<T extends ModelType> {
    protected __modelId: T['id'];
    protected __modelConfig(): ModelConfig { return {}; };

    private __eventListeners: Record<string, ModelEventCallback[] | undefined> = {};

    logger: Logger;

    constructor(id: T['id']) {
        this.__modelId = id;
        this.logger = logger.child({ label: this.toString() });

        const config = this.__modelConfig();
    }

    /**
     * Add an event listener.
     * @param eventName The name of the event to listen for.
     * @param listener The listener.
     */

    on<TEventName extends Extract<keyof T['events'], string>>(eventName: TEventName, listener: ModelEventCallback<T['events'][TEventName]['data']>) {
        this.__eventListeners[eventName] ??= [];
        this.__eventListeners[eventName]!.push(listener);
    }
    
    /**
     * Remove an event listener.
     * @param eventName The name of the event that is being listened for.
     * @param listener The listener.
     * @returns Whether the listener was found.
     */
    off<TEventName extends Extract<keyof T['events'], string>>(eventName: TEventName, listener: ModelEventCallback<T['events'][TEventName]['data']>) {
        if(this.__eventListeners[eventName]) {
            const oldLength = this.__eventListeners[eventName]!.length;
            this.__eventListeners[eventName] = this.__eventListeners[eventName]!.filter(listener2 => listener2 !== listener);
            const newLength = this.__eventListeners[eventName]!.length;
            return oldLength !== newLength;
        }

        return false;
    }

    /**
     * Emits an event.
     * @param eventName The name of the event to emit.
     * @param data Data to pass to the listener.
     * @returns The ModelEvent instance.
     */
    emit<TEventName extends Extract<keyof T['events'], string>>(eventName: TEventName, data: T['events'][TEventName]['data']) {
        const event = this.createEvent(eventName, data);
        return event.emit();
    }

    protected createEvent<TEventName extends Extract<keyof T['events'], string>>(eventName: TEventName, data?: T['events'][TEventName]['data']) {
        return new ModelEvent<T['events'][TEventName]>(this, this.__eventListeners[eventName] ?? [], eventName as string, data);
    }
    
    /**
     * Convert the model to a string.
     */
    toString(): string {
        const type = this.constructor.name;
        const id = this.getId();

        return id ? `[${type} ${id}]` : `[${type}]`;
    }

    /**
     * Convert the model to JSON.
     */
    toJSON(): any {
        return { id: this.getId() };
    }

    getId() {
        return this.__modelId;
    }
}

export default Model;
