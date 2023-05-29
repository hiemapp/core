import { componentFactory } from '../utils/helpers';
import HtmlNode from '../nodes/WidgetNode';

export interface HTMLDivElementProps {
}

const div = componentFactory<HTMLDivElementProps>(
    ({ className, children = [] }) => {
        return new HtmlNode(
            'div', 
            { className: [ className ] }, 
            children
        );
    }
)

export default div;