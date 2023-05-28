import { createComponent } from '../utils';
import { Node } from '../DashboardWidget';
import HtmlNode from '../HtmlNode';

export interface HeaderProps {
    color?: string,
    name?: string,
    children?: Node[]
}

const Header = createComponent<HeaderProps>(({ color, name, children = [] }) => {
    children.unshift(new HtmlNode('div', { className: 'hello!' }));

    return new HtmlNode(
        'span', 
        { className: color }, 
        children
    );
})

export default Header;