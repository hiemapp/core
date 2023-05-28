export default class TextNode {
    text: string;

    constructor(text: string) {
        this.text = text;
    }

    toJSON() {
        return { 
            text: this.text 
        }
    }
}