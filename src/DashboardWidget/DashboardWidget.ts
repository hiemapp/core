import { randomBytes } from 'crypto';
import ExtensionModule from '~/extensions/ExtensionModule';
import * as widgetComponents from './components';
import type HtmlNode from './HtmlNode';
import type TextNode from './TextNode';
import { parseNode } from './utils';

export type Node = HtmlNode | TextNode;
export type AbstractNode = Node | string;

export default class DashboardWidget extends ExtensionModule {
    static components = widgetComponents;
    private state = {};

    constructor() {
        super();
        console.log(this.serialize());
    }
    
    render(): AbstractNode | null {
        return null;
    }

    serialize(): any {
        return {
            document: parseNode(this.render()).toJSON()
        }
    }
}