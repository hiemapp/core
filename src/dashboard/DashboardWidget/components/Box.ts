import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';

export interface BoxProps {
    direction?: 'row' | 'column';
    gutterX?: 1 | 2 | 3 | 4 | 5;
    gutterY?: 1 | 2 | 3 | 4 | 5;
    align?: 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'self-start' | 'self-end',
    justify?: 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'self-start' | 'self-end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch'
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