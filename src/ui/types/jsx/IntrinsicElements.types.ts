import { HTMLAttributes } from './HTMLAttributes.types';
import { HTMLSpanElement } from './elements/HTMLSpanElement.types';
import { HTMLDivElement } from './elements/HTMLDivElement.types';
import { HTMLAnchorElement } from './elements/HTMLAnchorElement.types';
import { ValidElement } from '../types';

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