import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';
import { Icon as IconId } from '~/utils/icons';
import { Color } from '~/utils/style/colors';

export interface IconProps {
    id: IconId;
    size?: number | string;
    weight?: 'light' | 'solid';
    color?: Color
}

const Icon = componentFactory<IconProps>((props) => {
    return new WidgetNode('Icon', props);
})

export default Icon;