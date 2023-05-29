import type WidgetNode from '../nodes/WidgetNode';
import type TextNode from '../nodes/TextNode';

export type ValidNode = WidgetNode | TextNode;
export type Node = ValidNode | null;
export type ChildNode = Node | string;