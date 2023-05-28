export interface FlowProps {
    id: number;
    name: string;
    icon: string;
    blocklyWorkspace: FlowBlocklyWorkspace;
}
export interface FlowBlocklyWorkspace {
    languageVersion: number;
    blocks: FlowBlocklyWorkspaceBlock[];
}
export interface FlowBlocklyWorkspaceBlock {
    type: string;
    id: string;
    inputs: {
        [id: string]: FlowBlocklyWorkspaceBlockInput;
    };
    fields?: {
        [id: string]: any;
    };
    next?: {
        block: FlowBlocklyWorkspaceBlock;
    };
}
export interface FlowBlocklyWorkspaceBlockInput {
    shadow?: {
        type: string;
        id: string;
        fields?: {
            [id: string]: any;
        };
    };
    block?: FlowBlocklyWorkspaceBlock;
}
export interface FlowScriptBlock {
    type: string;
    id: string;
    parent: {
        id: string;
    };
    parameters: FlowScriptBlockParameter[];
    statements: FlowScriptBlockStatement[];
}
export interface FlowScriptBlockStatement {
    id: string;
    children: string[];
}
export interface FlowScriptBlockParameter {
    id: string;
    value: {
        block?: string | null;
        constant?: any;
    };
}
export interface FlowScript {
    blocks: FlowScriptBlock[];
}
export interface TaskrunnerFlowTaskData<TOriginalData = any> {
    originalKeyword: string;
    originalData?: TOriginalData;
    ctx: {
        flowId: number;
        block: {
            id: string;
            type: string;
        };
    };
}
