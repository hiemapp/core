import EventEmitter from 'events'

// Adapted from: https://blog.makerx.com.au/a-type-safe-event-emitter-in-node-js/
export default class TypedEventEmitter<TEvents extends Record<string, any>> {
    private emitter = new EventEmitter()

    emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...args: TEvents[TEventName]) {
        this.emitter.emit(eventName, ...(args as []));
    }

    on<TEventName extends keyof TEvents & string>(eventName: TEventName, listener: (...args: TEvents[TEventName]) => void) {
        this.emitter.on(eventName, listener as any);
    }

    off<TEventName extends keyof TEvents & string>(eventName: TEventName, listener: (...args: TEvents[TEventName]) => void) {
        this.emitter.off(eventName, listener as any);
    }
}