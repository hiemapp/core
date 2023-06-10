import { Component, HTMLElementProps } from '~/ui/types';
import * as jsx from '../types';
import { colors, type Color } from '~/utils/style/colors';

export interface TextProps extends HTMLElementProps {
    muted?: boolean;
    mutedAlt?: boolean;
    color?: Color;
    weight?: number | string;
    size?: number | string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'p'
}

const Text: Component<TextProps> = ({ 
    muted = false, 
    mutedAlt = false, 
    color = undefined,
    weight = undefined,
    size = undefined,
    as: ElementType = 'span',
    style,
    children,
    ...rest
}) => {
    if(muted) {
        color = colors.TEXT_MUTED;
    } else if(mutedAlt) {
        color = colors.TEXT_MUTED_ALT;
    }

    const fontWeight = (typeof weight === 'number' ? weight : undefined);
    const fontSize = (typeof size === 'number' ? size+'px' : size);

    return (
        <ElementType {...rest} 
            style={{ 
                color, 
                fontWeight, 
                fontSize,
                ...style }}>
            {children}
        </ElementType>
    )
}

export default Text;