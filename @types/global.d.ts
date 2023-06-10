import { AnyElement } from './ui';

declare global {
    namespace JSX {
        type IntrinsicElements = Record<string, any>
        type Element = AnyElement;
    }
}