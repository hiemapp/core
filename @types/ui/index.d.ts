import type { HTMLElement } from '../../src/@types/jsx';

export interface ElementInterface {
    serialize: () => SerializedElement;
}

export type ValidElement = ElementInterface | null;
export type AnyElement = ValidElement | string | boolean;

export interface SerializedElement {
    tag: string | null;
    props?: HTMLElementProps;
    text?: string;
    children?: SerializedElement[] | null;
    listeners?: Record<string, any>;
}

export type HTMLElementProps = HTMLElement['attributes'] & {
    children?: AnyElement[] | null;
};

export interface HTMLElementListener {
    id: string;
}

export type Component<TProps extends Record<string, any> = {}> =
    (props: TProps) => JSX.Element