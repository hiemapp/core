import { HTMLAttributes } from './HTMLAttributes';
import { HTMLSpanElement } from './elements/HTMLSpanElement';
import { HTMLDivElement } from './elements/HTMLDivElement';
import { HTMLAnchorElement } from './elements/HTMLAnchorElement';

export interface IntrinsicElements {
    span: HTMLAttributes<HTMLSpanElement>
    div: HTMLAttributes<HTMLDivElement>
    a: HTMLAttributes<HTMLAnchorElement>
    clientelement: {
        tag: string;
        props?: Record<string, any>;
        children?: ValidElement[]
    }
}