import { AnyElement } from '../src/ui/types';

declare global {
    namespace JSX {
        type IntrinsicElements = Record<string, any>
        type Element = AnyElement;
    }
}