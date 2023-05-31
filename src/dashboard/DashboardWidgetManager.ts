import { uuid } from '~/utils';
import { ExtensionController, SerializedNode } from '..';
import DashboardWidget from './DashboardWidget/DashboardWidget';

export type WidgetSessionData = {
    userId: number;
    slug: string;
}

export interface RememberedWidgetContent {
    content: SerializedNode;
    contentId: string;
}

export default class DashboardWidgetManager {
    protected static sessions: Record<string, DashboardWidget> = {};
    protected static rememberedContent: Record<string, RememberedWidgetContent[]> = {};

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

        // Create a new widget instance
        const widget = new widgetType(sessionId);
        this.sessions[sessionId] = widget;
        widget.onMount();

        return widget;
    }

    static getOrCreateWidget(slug: string, sessionId: string): DashboardWidget | null {
        let widget = this.getWidget(sessionId);
        return widget ? widget : this.createWidget(slug, sessionId);
    }

    static handleWidgetEvent(sessionId: string, event: string, contentHash: string, slug: string) {

    }
}