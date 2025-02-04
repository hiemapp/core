import Model from '~/lib/Model';

export type ScriptEventListenerCallback = (...args: any[]) => unknown;
export interface ScriptEventListener { 
    event: string, 
    callback: ScriptEventListenerCallback, 
    model: Model<any>,
    onRemove?: () => unknown
}

export default class ScriptEventListenerManager {
    protected listeners: ScriptEventListener[] = [];

    handle(model: Model<any>, event: string, data: any) {
        this.listeners.forEach(l => {
            if(l.model === model && l.event === event) {
                l.callback(data);
            }
        })
    }

    add(event: string, callback: ScriptEventListenerCallback, model: Model<any>, onRemove?: () => unknown) {
        console.log('add', event, callback);
        this.listeners.push({ event, callback, model, onRemove })
    }

    remove(event: string, callback: ScriptEventListenerCallback, model: Model<any>) {
        console.log('remove', event, callback);

        const listenersLengthBefore = this.listeners.length;
        this.listeners = this.listeners.filter(l => {
            const shouldRemove = (l.event === event && l.callback === callback && l.model === model);
            if(!shouldRemove) return true;

            if(typeof l.onRemove === 'function') {
                l.onRemove();
            }

            return false;
        });
        return this.listeners.length !== listenersLengthBefore;
    }
    
    removeAll() {
        this.listeners.forEach(listener => {
            this.remove(listener.event, listener.callback, listener.model);
        })

        this.listeners = [];
    }
}