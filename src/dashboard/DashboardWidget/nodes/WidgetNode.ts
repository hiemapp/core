import { pickBy } from 'lodash';
import type { ValidNode } from '../utils/types';
import type { SerializedNode } from '~types';

export type WidgetNodeAttributes = Record<string, any>
export type WidgetNodeListeners = Record<string, undefined | ((...args: any[]) => any)>;

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
        this.listeners = listeners && pickBy(listeners, cb => typeof cb === 'function');
    }

    serialize(nextId: () => number): SerializedNode {
        return {
            id: nextId(),
            tag: this.tag,
            attributes: this.attributes,
            children: this.children && this.children.map(c => c.serialize(nextId)),
            events: this.listeners && Object.keys(this.listeners)
        }
    }
}