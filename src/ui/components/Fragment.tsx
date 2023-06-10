import { Component } from '~/ui/types';
import * as jsx from '../types';

export interface FragmentProps {}

const Fragment: Component<FragmentProps> = (props) => (
    <clientelement tag="Fragment" props={props} />
)

export default Fragment;