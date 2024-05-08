// TODO: add a function to each listener
import type Model from './Model';

export interface CancellableModelEvent {
    cancel: () => void;
}

export type ModelEventData<TEvent> = Omit<TEvent, keyof CancellableModelEvent>;

export type ModelEventCallback<TData = any> = (data: TData) => unknown;

export default class ModelEvent<TEvent extends {} = {}> {
    protected model;
    protected listeners;
    protected eventName;
    protected data?;

    public isCanceled: boolean = false;

    constructor(model: Model<any>, listeners: ModelEventCallback[], eventName: string, data?: ModelEventData<TEvent>) {
        this.model = model;
        this.listeners = listeners;
        this.eventName = eventName;
        this.data = data;
    }

    async emit() {
        await Promise.all(this.listeners.map((callback, i) => {
            if(typeof callback !== 'function') return;
        
            const data = {
                ...(this.data ?? {}),
                cancel: this.cancelHandler.bind(this)
            }

            try {
                return callback(data);
            } catch(err: any) {
                this.model.logger.error(`Error while emitting event '${this.eventName}':`, err);
            }
        }));

        return this;
    }

    protected cancelHandler(isCanceled: boolean = true) {
        this.isCanceled = isCanceled;
    }
}