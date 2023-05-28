import _ from 'lodash';
import { Node } from './DashboardWidget';

interface HtmlNodeAttributes {
    className?: string,
    [key: string]: any
}

export default class HtmlNode {
    tag: string;
    attributes: HtmlNodeAttributes;
    children: Node[];

    constructor(tag: string, attributes: HtmlNodeAttributes, children: Node[] = []) {       
        this.tag = tag;
        this.children = children;
        this.attributes = attributes;
    }

    toJSON() {
        return {
            tag: this.tag,
            attributes: this.attributes,
            children: this.children
        }
    }
}