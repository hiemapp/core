import { Icon as IconId } from '~/utils/icons';
import { Color } from '~/utils/style/colors';
import { Component, HTMLElementProps } from '~/ui/types';
import * as jsx from '../types';

export interface IconProps extends HTMLElementProps {
    id: IconId;
    size?: number | string;
    weight?: 'light' | 'solid';
    color?: Color
}

const Icon: Component<IconProps> = (props) => {
    return <clientelement tag="Icon" props={props} />
}

export default Icon;