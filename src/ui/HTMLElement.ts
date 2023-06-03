import TextElement from './TextElement';
import { HTMLElementProps, HTMLElementListener, SerializedElement, ElementInterface, ValidElement, AnyElement } from '~types';
import { formatElement } from './utils/helpers';
import { flatten } from 'lodash';

export default class HTMLElement implements ElementInterface {
    protected readonly tag: string;
    protected readonly props: HTMLElementProps;
    protected readonly children: ValidElement[] | null;
    protected readonly listeners: Record<string, HTMLElementListener> = {};

    constructor(
        tag: string, 
        props: HTMLElementProps | null, 
        children: AnyElement[] | null,
        listeners: Record<string, HTMLElementListener> = {}
    ) {       
        this.tag = tag;
        this.props = props ?? {};
        this.children = Array.isArray(children) ? flatten(children).map(formatElement) : null;
        this.listeners = listeners;
        
        // Make className prop a string
        if(Array.isArray(this.props.className)) {
            this.props.className = this.props.className && flatten(this.props.className).join(' ');
        }
    }

    serialize(): SerializedElement {
        return {
            tag: this.tag, 
            props: this.props, 
            children: this.#getSerializedChildren(),
            listeners: this.listeners
        };
    }

    #getSerializedChildren(): SerializedElement[] | null {
        if(!this.children?.length) {
            return null;
        }

        const serialized = this.children.reduce((acc: SerializedElement[], child) => {
            if(child instanceof TextElement || child instanceof HTMLElement) {
                acc.push(child.serialize());
            }

            return acc;
        }, []);

        return serialized;
    }
}