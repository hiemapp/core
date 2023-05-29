import _ from 'lodash';
import TextNode from '../nodes/TextNode';
import type { Node, ValidNode } from './types';
import type { SerializedNode, WrapperProps, RenderProps } from '~types';
import DashboardWidget from '../DashboardWidget';
import WidgetNode from '../nodes/WidgetNode';

export function serializeWidgetNode(node: Node): null | SerializedNode {
    if(!node) return null;

    let idCounter = 0;
    const nextId = () => idCounter++;

    return node.serialize(nextId);
}

/**
 * Convert text strings to a TextNode.
 */
export function formatNode(node: Node | string): Node {
    if(typeof node === 'string') return new TextNode(node);
    return node;
}

export function componentFactory<TProps>(render: (props: RenderProps<TProps>) => Node | string) {
    function wrapper(props?: WrapperProps<TProps>, ...children: Node[]): Node;
    function wrapper(...children: Node[]): Node;
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