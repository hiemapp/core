import _ from 'lodash';
import TextNode from '../nodes/TextNode';
import type { ChildNode, Node, ValidNode } from './types';
import type { SerializedNode, WrapperProps, RenderProps } from '~types';
import WidgetNode from '../nodes/WidgetNode';
import DashboardWidget from '../DashboardWidget';

export function renderWidgetAndSerialize(widget: DashboardWidget): null | SerializedNode {
    const node = formatNode(widget.render());
    if(!node) return null;

    let idCounter = 0;
    const nextId = () => idCounter++;

    return node.serialize(nextId);
}

/**
 * Convert text strings to a TextNode.
 */
export function formatNode(node: ChildNode): Node {
    if(typeof node === 'string') return new TextNode(node);
    return node;
}

export function componentFactory<TProps>(render: (props: RenderProps<TProps>) => Node | string) {
    function wrapper(props?: WrapperProps<TProps>, ...children: ChildNode[]): Node;
    function wrapper(...children: ChildNode[]): Node;
    function wrapper(...args: any[]): Node {
        const hasProps = !Array.isArray(args[0]);
        const children: Node[] = hasProps ? args.slice(1) : args;
        const props: TProps = hasProps ? args[0] : {};

        const parsedChildren = children.map(formatNode);
        const validChildren = parsedChildren.filter(c => c instanceof TextNode || c instanceof WidgetNode) as ValidNode[];

        return formatNode(
            render({ 
                ...props, 
                children: validChildren 
            }
        ));
    }

    return wrapper;
}