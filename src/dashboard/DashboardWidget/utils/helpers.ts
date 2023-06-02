import TextNode from '../nodes/TextNode';
import type { ChildNode, Node, ValidNode } from './types';
import type { SerializedNode, WrapperProps, RenderProps } from '~types';
import WidgetNode from '../nodes/WidgetNode';
import DashboardWidget from '../DashboardWidget';
import { isPlainObject } from 'lodash';

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
    if(typeof node === 'string' || typeof node === 'number') {
        return new TextNode(node);

    }
    
    return node;
}

export function componentFactory<TProps>(render: (props: RenderProps<TProps>) => Node | string) {
    function wrapper(props: WrapperProps<TProps>): Node {
        let validChildren: Node[] = [];
        
        if(props.children) {
            const parsedChildren = props.children.map(formatNode);
            validChildren = parsedChildren.filter(c => c instanceof TextNode || c instanceof WidgetNode) as ValidNode[];
        }

        return formatNode(
            render({ 
                ...props, 
                children: validChildren 
            }
        ));
    }

    return wrapper;
}