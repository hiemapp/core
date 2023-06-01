import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';
import { Color } from '~/utils/style/colors';
import { DashboardWidgetListener } from '../DashboardWidget';

export interface SpanProps {

}

const span = componentFactory<SpanProps>(
    ({ children, ...props }) => {
        return new WidgetNode(
            'span', 
            props,
            children
        );
    }
)

export default span;