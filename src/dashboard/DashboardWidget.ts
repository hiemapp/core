import ExtensionModule from '~/extensions/ExtensionModule';
import icons from '~/utils/icons';
import { WebSocket } from '~/lib';
import { colors, type Color } from '~/utils/style/colors';
import type { HTMLElementListener } from '~types/ui';
import type { Icon } from '~/utils/icons';
import type { AnyElement } from '~types/ui';

export interface DashboardWidgetManifest {
    title: string;
    color: Color;
    icon: Icon;
}

export type DashboardWidgetContent = AnyElement;

export default class DashboardWidget<TState extends Record<string, any> = {}> extends ExtensionModule {
    #state: TState = {} as TState;
    #callbacks: Record<string, () => unknown> = {};
    sessionId: string;

    constructor(sessionId: string) {
        super();
        
        this.sessionId = sessionId;
    }

    getManifest(): DashboardWidgetManifest {
        return {
            title: 'My widget',
            color: colors.BLUE[5],
            icon: icons.CIRCLE_QUESTION
        }
    }
    
    onMount(): void {

    }
     
    render(): DashboardWidgetContent {
        return null;
    }

    createListener(id: string, callback: () => unknown): HTMLElementListener {
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
        WebSocket.emit('widget:update', {
            widgetSessionId: this.sessionId
        })
    }
}