import { Component, HTMLElementProps } from '~/ui/types';
import * as jsx from '../types';

export interface GridProps extends HTMLElementProps {
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    gy?: 0 | 1 | 2 | 3 | 4 | 5;
    gx?: 0 | 1 | 2 | 3 | 4 | 5;
    align?: 'center' | 'start' | 'end';
    justify?: 'center' | 'start' | 'end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch';
    wrap?: boolean;
}

const Grid: Component<GridProps> = (props) => (
    <clientelement tag="Grid" props={props} />
)

export default Grid;