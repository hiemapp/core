import WidgetNode from '../nodes/WidgetNode';
import TextNode from '../nodes/TextNode';

export type ValidNode = WidgetNode | TextNode;
export type Node = ValidNode | null;