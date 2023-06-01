import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';

export interface BoxProps {
    direction?: 'row' | 'column';
    gutterX?: 0 | 1 | 2 | 3 | 4 | 5;
    gutterY?: 0 | 1 | 2 | 3 | 4 | 5;
    align?: 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'self-start' | 'self-end',
    justify?: 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'self-start' | 'self-end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch'
    wrap?: 'wrap' | 'nowrap'
}

const Box = componentFactory<BoxProps>(
    ({ children = [], ...props }) => {
        return new WidgetNode(
            'Box', 
            props,
            children
        );
    }
)

export default Box;