import { HTMLElement } from '../HTMLElement'

export type HTMLAnchorElement = HTMLElement & {
    attributes: {
        href?: string;
        rel?: string;
    }
}