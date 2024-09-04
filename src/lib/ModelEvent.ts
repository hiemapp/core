import _ from 'lodash';
import type Model from './Model';
import type User from '~/users/User';
import { ModelEventListener } from './Model';
import FlowBlock from '~/flows/Flow';

export interface ModelEventReason { user?: User, flowBlock?: FlowBlock };

export default class ModelEvent<TEventData extends any> {
    protected model;
    protected listeners;
    protected eventName;
    protected data;

    public isCanceled: boolean = false;

    constructor(model: Model<any>, listeners: ModelEventListener[], eventName: string, data: TEventData) {
        this.model = model;
        this.listeners = listeners;
        this.eventName = eventName;
        this.data = data;
    }

    async emit() {
        await Promise.all(this.listeners.map((listener, i) => {
            if(typeof listener?.callback !== 'function') return;
            
            try {
                return listener.callback(this.data ?? {});
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