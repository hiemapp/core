import type { Component } from '../../../types';
import * as jsx from '../jsx';

export interface TileProps extends JSX.Props {
    size?: 'sm'|'md'|'lg';
}

const Tile: Component<TileProps> = (props) => (
    <clientelement tag="Tile" props={props} />
)

export default Tile;