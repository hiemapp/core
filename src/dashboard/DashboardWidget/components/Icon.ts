import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';
import { Icon as IconId } from '~/utils/icons';

export interface IconProps {
    id: IconId
}

const Icon = componentFactory<IconProps>((props) => {
    return new WidgetNode('Icon', props);
})

export default Icon;