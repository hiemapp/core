import { componentFactory } from '../utils/helpers';
import HtmlNode from '../nodes/WidgetNode';

export interface HTMLImgElementProps {
    alt?: string;
    src: string;
}

const img = componentFactory<HTMLImgElementProps>(
    ({ children = [], ...props }) => {
        return new HtmlNode(
            'img', 
            props, 
            children
        );
    }
)

export default img;