import { Component } from '~types';
import * as jsx from '../jsx';
import type { ColorPalette } from '~/utils/style/colors';
import { DashboardWidgetListener } from '../../dashboard/DashboardWidget';

export interface ButtonProps extends JSX.Props {
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

const Button: Component<ButtonProps> = (props) => (
    <clientelement tag="Button" props={props} />
)

export default Button;