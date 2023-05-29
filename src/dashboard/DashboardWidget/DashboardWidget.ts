import ExtensionModule from '~/extensions/ExtensionModule';
import icons from '~/utils/icons';
import { DashboardWidgetManifest } from '~types';
import { DashboardWidgetNode } from '~/extensions/api/dashboard';
import colors from '~/utils/colors';
import { WebSocket } from '~/lib';

export default class DashboardWidget<TState extends Record<string, any> = {}> extends ExtensionModule {
    #state: TState = {} as TState;
    sessionId: string;

    constructor(sessionId: string) {
        super();
        
        this.sessionId = sessionId;
    }

    getManifest(): DashboardWidgetManifest {
        return {
            title: 'My widget',
            color: colors.BLUE,
            icon: icons.CIRCLE_QUESTION
        }
    }
    
    onMount(): void {

    }
     
    render(): DashboardWidgetNode {
        return null;
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