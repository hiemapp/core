import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';

export interface FragmentProps {
    onClick?: () => unknown
}

const Fragment = componentFactory<FragmentProps>(
    () =>  new WidgetNode('FRAGMENT')
)

export default Fragment;