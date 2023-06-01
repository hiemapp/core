import { flattenDeep, pickBy } from 'lodash';
import type { ValidNode } from '../utils/types';
import type { SerializedNode } from '~types';
import type { DashboardWidgetListener } from '../DashboardWidget';

export type WidgetNodeAttributes = Record<string, any>
export type WidgetNodeListeners = Record<string, DashboardWidgetListener | undefined>;

export default class WidgetNode {
    protected readonly tag: string;
    protected readonly attributes?: WidgetNodeAttributes;
    protected readonly children?: ValidNode[];
    protected readonly listeners?: WidgetNodeListeners;

    constructor(
        tag: string, 
        attributes?: WidgetNodeAttributes, 
        children?: ValidNode[],
        listeners?: WidgetNodeListeners
    ) {       
        this.tag = tag;
        this.children = children;
        this.attributes = attributes;

        // Convert classname to string if it's an array
        if(this.attributes?.className && Array.isArray(this.attributes?.className)) {
            this.attributes.className = flattenDeep(this.attributes.className).join(' ');
        }

        this.listeners = listeners;
    }

    serialize(nextId: () => number): SerializedNode {
        const nodeId = nextId();

        return {
            id: nodeId,
            tag: this.tag,
            attributes: this.attributes,
            children: this.children && this.children.map(c => c.serialize(nextId)),
            listeners: pickBy(this.listeners, l => typeof l !== 'undefined')
        }
    }
}