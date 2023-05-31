import ExtensionModule from '~/extensions/ExtensionModule';
import icons from '~/utils/icons';
import { DashboardWidgetManifest } from '~types';
import { DashboardWidgetNode } from '~/extensions/api/dashboard';
import colorPalettes from '~/utils/style/colorPalettes';
import { WebSocket } from '~/lib';

export type DashboardWidgetListenerCallback = () => unknown;
export type DashboardWidgetListener = { id: string };

export default class DashboardWidget<TState extends Record<string, any> = {}> extends ExtensionModule {
    #state: TState = {} as TState;
    #callbacks: Record<string, DashboardWidgetListenerCallback> = {};
    sessionId: string;

    constructor(sessionId: string) {
        super();
        
        this.sessionId = sessionId;
    }

    getManifest(): DashboardWidgetManifest {
        return {
            title: 'My widget',
            accent: colorPalettes.BLUE,
            icon: icons.CIRCLE_QUESTION
        }
    }
    
    onMount(): void {

    }
     
    render(): DashboardWidgetNode {
        return null;
    }

    createListener(id: string, callback: DashboardWidgetListenerCallback): DashboardWidgetListener {
        this.#callbacks[id] = callback;
        return { id };
    }

    getListener(id: string) {
        if(!this.#callbacks[id]) return null;

        return { 
            id,
            callback: this.#callbacks[id]
        }
    }

    getState<TKey extends keyof TState>(key: TKey): TState[TKey] {
        return this.#state[key];
    }

    setState<TKey extends keyof TState>(key: TKey, value: TState[TKey]): void {
        const currentValue = this.#state[key];
        if(value !== currentValue) {
            this.#state[key] = value;
            this.#emitUpdateEvent();
        }   
    }

    #emitUpdateEvent() {
        WebSocket.emit('dashboard:widgetupdate', {
            widgetSessionId: this.sessionId
        })
    }
}