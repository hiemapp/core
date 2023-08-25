import { ExtensionModuleFactory } from '~/extensions/ExtensionModule';
import icons from '~/utils/icons';
import { WebSocket } from '~/lib';
import { colors } from '~/utils/style/colors';
import type { HTMLElementListener } from '~/ui/types';
import type { DashboardWidgetManifest } from './DashboardWidgetManifest.types';
import type { DashboardWidgetContent } from './DashboardWidgetContent.types';

export default class DashboardWidget<TState extends Record<string, any> = {}> extends ExtensionModuleFactory<DashboardWidgetManifest>() {
    #state: TState = {} as TState;
    #callbacks: Record<string, () => unknown> = {};
    sessionId: string;

    make(ctx: {}) {
        return;
    }

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