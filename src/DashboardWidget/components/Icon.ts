import { createComponent } from '../utils';
import HtmlNode from '../HtmlNode';

export interface IconProps {
    id: string
}

const Icon = createComponent<IconProps>((props) => {
    return new HtmlNode('Icon', props);
})

export default Icon;