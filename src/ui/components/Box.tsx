import { Component } from '~types';
import * as jsx from '../jsx';

export interface BoxProps extends JSX.Props {
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    gy?: 0 | 1 | 2 | 3 | 4 | 5;
    gx?: 0 | 1 | 2 | 3 | 4 | 5;
    align?: 'center' | 'start' | 'end';
    justify?: 'center' | 'start' | 'end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch';
    wrap?: boolean;
}

const Box: Component<BoxProps> = (props) => (
    <clientelement tag="Box" props={props} />
)

export default Box;