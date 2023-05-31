import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';
import type { ColorPalette } from '~/utils/style/colorPalettes';
import { DashboardWidgetListener } from '../DashboardWidget';

export interface ButtonProps {
    onClick?: DashboardWidgetListener;
    variant?: 'primary' | 'secondary' | 'unstyled' | 'link';
    active?: boolean;
    loading?: boolean;
    disabled?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    square?: boolean;
    primary?: ColorPalette;
    secondary?: ColorPalette;
    round?: boolean;
    to?: string;
    stretch?: boolean
}

const Button = componentFactory<ButtonProps>(
    ({ onClick, children, ...props }) => {
        return new WidgetNode(
            'Button', 
            props,
            children,
            { onClick }
        );
    }
)

export default Button;