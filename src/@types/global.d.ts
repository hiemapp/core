import { AnyElement, ValidElement } from '~/ui/types';
import { IntrinsicElements as _IntrinsicElements } from './jsx/IntrinsicElements';
import { HTMLElement } from './jsx/HTMLElement';

declare global {
    namespace JSX {
        type Element = AnyElement;
        type IntrinsicElements = _IntrinsicElements;
        type Props = {
            style?: HTMLElement['attributes']['style'];
            children?: ValidElement[]
        }
    }
}