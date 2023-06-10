import { SerializedElement, ElementInterface } from './types';

export default class TextElement implements ElementInterface {
    text: string;

    constructor(content: any) {
        this.text = typeof content?.toString === 'function' ? content.toString() : content+'';
    }

    serialize(): SerializedElement {
        return { 
            tag: null,
            text: (this.text+'')
        }
    }
}