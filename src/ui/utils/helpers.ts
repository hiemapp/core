import { AnyElement, SerializedElement, ValidElement } from '~types';
import TextElement from '../TextElement';
import HTMLElement from '../HTMLElement';

export function renderWidgetAndSerialize(elem: AnyElement): null | SerializedElement {
    if(elem instanceof TextElement || elem instanceof HTMLElement) {
        return elem.serialize();
    }

    return null;
}

/**
 * Convert any element to a valid element.
 */
export function formatElement(elem: AnyElement): ValidElement {
    if(elem instanceof TextElement || elem instanceof HTMLElement) {
        return elem;
    }

    if(elem === null) {
        return null;
    }

    return new TextElement(elem);
}