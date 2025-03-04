import type ModelWithProps from '~/lib/ModelWithProps';
import type FlowBlock from './FlowBlock';
import { FlowBlockContext } from '.';

/* INPUT */
export interface IFlowBlockLayout_input {
    id: string;
    inheritLocale?: string;
}

/* PARAMETER */
export type IFlowBlockLayout_parameter_value = string | number | boolean | null | undefined;
export type IFlowBlockLayout_parameter_type = 'string' | 'number' | 'boolean' | 'color' | 'date' | 'device' | 'flow' | 'extension' | 'user' | 'unknown' | 'any' | 'null';
export type IFlowBlockLayout_parameter_shadow_type = IFlowBlockLayout_parameter_type | 'time' | typeof FlowBlock | string;
export type IFlowBlockLayout_parameter_option = {
    id?: string;
    label?: string;
    value: IFlowBlockLayout_parameter_value;
} | ModelWithProps<any>;

export type IFlowBlockLayout_parameter_provider = {
    handler: (values: Record<string, unknown>) => { 
        options?: IFlowBlockLayout_parameter['options'] 
    };
    dependencies: string[];
}

export interface IFlowBlockLayout_parameter extends IFlowBlockLayout_input {
    type: IFlowBlockLayout_parameter_type | IFlowBlockLayout_parameter_type[];
    provider?: IFlowBlockLayout_parameter_provider;
    options?: IFlowBlockLayout_parameter_option[];
    shadow?: {
        type?: string;
        values?: Record<string, any>;
    };
    blockly?: any;
    variable?: boolean;
}

/* STATEMENT */
export interface IFlowBlockLayout_statement extends IFlowBlockLayout_input {
    showLabel?: boolean;
}

/* BLOCK */
export interface IFlowBlockLayout {
    connections?: {
        top?: boolean;
        bottom?: boolean;
    };
    parameters?: IFlowBlockLayout_parameter[];
    statements?: IFlowBlockLayout_statement[];
    output?: {
        type?: IFlowBlockLayout_parameter_type | IFlowBlockLayout_parameter_type[];
    };
    helpUrl?: string;
}

export interface IFlowBlockLayoutSerialized extends IFlowBlockLayout {
    connections: Exclude<Required<IFlowBlockLayout['connections']>, undefined>;
    parameters: IFlowBlockLayoutSerialized_parameter[];
    statements: Exclude<Required<IFlowBlockLayout['statements']>, undefined>;
    output: Required<IFlowBlockLayout['output']>
}

export interface IFlowBlockLayoutSerialized_parameter extends Omit<IFlowBlockLayout_parameter, 'provider'> {
    provider?: IFlowBlockLayout_parameter['provider'] & {
        handler?: true
    };
    options?: {
        id?: string;
        label?: string;
        value: string;
    }[]
}[]
