import type { HTMLElement } from '../HTMLElement.types'

export type HTMLAnchorElement = HTMLElement & {
    attributes: {
        href?: string;
        rel?: string;
    }
}