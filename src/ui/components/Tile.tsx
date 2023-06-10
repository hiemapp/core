import type { Component, HTMLElementProps } from '~/ui/types';
import * as jsx from '../types';

export interface TileProps extends HTMLElementProps {
    size?: 'sm'|'md'|'lg';
    background?: string;
    color?: string;
}

const Tile: Component<TileProps> = (props) => (
    <clientelement tag="Tile" props={props} />
)

export default Tile;