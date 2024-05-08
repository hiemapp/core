import { ModelWithPropsType } from '~/lib/ModelWithProps';

export interface ScriptType extends ModelWithPropsType {
    id: number,
    props: ScriptProps,
    serializedProps: ScriptProps,
    events: {}
}

export interface ScriptProps {
    id: number;
    name: string;
    icon: string;
    code: string;
}