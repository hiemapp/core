export type FlowBlockManifestParameterTypeConst = 'string' | 'number' | 'boolean' | 'color' | 'date' | 'any';
export type FlowBlockManifestParameterType = FlowBlockManifestParameterTypeConst | FlowBlockManifestParameterTypeConst[];
export type FlowBlockManifestParameterShadowType = FlowBlockManifestParameterType | 'date.time' | 'date.now';
export type FlowBlockManifestParameterValue = string | number | boolean | null | undefined;
export type FlowBlockManifestParameterOption = {
    key?: string;
    label?: string;
    value: FlowBlockManifestParameterValue;
};
export interface FlowBlockManifestParameter {
    id: string;
    type: FlowBlockManifestParameterType;
    options?: FlowBlockManifestParameterOption[];
    shadow?: {
        type?: FlowBlockManifestParameterShadowType;
        value?: any;
    };
    blockly?: any;
}
export interface FlowBlockManifestStatement {
    id: string;
    showLabel?: boolean;
}
export interface FlowBlockManifest {
    icon?: string;
    category: string;
    connections?: {
        top?: boolean;
        bottom?: boolean;
    };
    parameters?: FlowBlockManifestParameter[];
    statements?: FlowBlockManifestStatement[];
    output?: {
        type?: FlowBlockManifestParameterType;
    };
    helpUrl?: string;
}
export interface FlowBlockTask<TData = any> {
    keyword: string;
    data: TData;
}
export interface FlowBlockManifestSerialized extends FlowBlockManifest {
}
