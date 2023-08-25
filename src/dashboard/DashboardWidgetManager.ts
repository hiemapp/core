import { ExtensionController } from '..';
import DashboardWidget from './DashboardWidget';

export type WidgetSessionData = {
    userId: number;
    slug: string;
}

export default class DashboardWidgetManager {
    protected static sessions: Record<string, DashboardWidget> = {};

    static getWidget(sessionId: string) {
        if(this.sessions[sessionId]) {
            return this.sessions[sessionId];
        }

        return null;
    }

    static createWidget(slug: string, sessionId: string) {
        const widgetType = ExtensionController.findModuleOrFail(DashboardWidget, slug);
        if(!widgetType) {
            return null;
        }

        // // Create a new widget instance
        // const widget = widgetType.make({ sessionId });
        // this.sessions[sessionId] = widget;
        // widget.onMount();

        // return widget;
        return null;
    }

    static getOrCreateWidget(slug: string, sessionId: string): DashboardWidget | null {
        let widget = this.getWidget(sessionId);
        
        if(widget) {
            return widget;
        }

        return this.createWidget(slug, sessionId);
    }

    static handleWidgetEvent(sessionId: string, event: string, contentHash: string, slug: string) {

    }
}