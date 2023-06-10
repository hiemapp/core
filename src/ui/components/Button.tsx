import { Component, HTMLElementProps, HTMLElementListener } from '~/ui/types';
import * as jsx from '../types';
import type { ColorPalette } from '~/utils/style/colors';

export interface ButtonProps extends HTMLElementProps {
    onClick?: HTMLElementListener;
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