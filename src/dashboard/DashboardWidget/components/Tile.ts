import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';
import type { Color } from '~/utils/style/colors';

export interface Tile {
    background?: Color;
    color?: Color;
    size?: 'sm' | 'md' | 'lg';
}

const Tile = componentFactory<Tile>(
    ({ children, ...props }) => {
        return new WidgetNode(
            'Tile', 
            props,
            children
        );
    }
)

export default Tile;