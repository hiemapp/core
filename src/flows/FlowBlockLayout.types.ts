export type FlowBlockLayoutParameterTypeConst = 'string' | 'number' | 'boolean' | 'color' | 'date' | 'any';
export type FlowBlockLayoutParameterType = FlowBlockLayoutParameterTypeConst | FlowBlockLayoutParameterTypeConst[];
export type FlowBlockLayoutParameterShadowType = FlowBlockLayoutParameterType | 'date.time' | 'date.now';
export type FlowBlockLayoutParameterValue = string | number | boolean | null | undefined;
export type FlowBlockLayoutParameterOption = {
    key?: string;
    label?: string;
    value: FlowBlockLayoutParameterValue;
};
export interface FlowBlockLayoutParameter {
    id: string;
    type: FlowBlockLayoutParameterType;
    options?: FlowBlockLayoutParameterOption[];
    shadow?: {
        type?: FlowBlockLayoutParameterShadowType;
        value?: any;
    };
    blockly?: any;
}
export interface FlowBlockLayoutStatement {
    id: string;
    showLabel?: boolean;
}
export interface FlowBlockLayout {
    connections?: {
        top?: boolean;
        bottom?: boolean;
    };
    parameters?: FlowBlockLayoutParameter[];
    statements?: FlowBlockLayoutStatement[];
    output?: {
        type?: FlowBlockLayoutParameterType;
    };
    helpUrl?: string;
}
export interface FlowBlockLayoutSerialized extends FlowBlockLayout {
}
