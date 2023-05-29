import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';

export interface HeaderProps {
    color?: string,
    name?: string
}

const Header = componentFactory<HeaderProps>(
    ({ color, name, children = [] }) => {
        return new WidgetNode(
            'span', 
            { className: color }, 
            children
        );
    }
)

export default Header;