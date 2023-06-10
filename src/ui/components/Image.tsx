import { Component, HTMLElementProps } from '~/ui/types';
import * as jsx from '../types';

export interface ImageProps extends HTMLElementProps {
    src: string;
    alt?: string;
    height?: number;
    width?: number;
}

const Image: Component<ImageProps> = ({ src, alt, height, width }) => {
    const props = {
        src: src,
        alt: alt ?? '',
        height: height,
        width: width,
        style: {
            height: height && height+'px',
            width: width && width+'px',
            borderRadius: 'var(--border-radius-sm)',
            overflow: 'hidden'
        }
    };

    return <clientelement tag="img" props={props} />
}

export default Image;