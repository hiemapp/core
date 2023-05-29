import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';
import { Color } from '~/utils/colors';

export interface ButtonProps {
    onClick?: () => unknown;
    variant?: 'primary' | 'secondary' | 'unstyled' | 'link';
    active?: boolean;
    loading?: boolean;
    disabled?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    square?: boolean;
    primary?: Color;
    secondary?: Color;
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