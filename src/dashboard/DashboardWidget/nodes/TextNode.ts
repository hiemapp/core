import { SerializedNode } from '~types';

export default class TextNode {
    text: string;

    constructor(text: string | number) {
        this.text = text+'';
    }

    serialize(): SerializedNode {
        return { 
            text: (this.text+'')
        }
    }
}