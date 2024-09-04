export interface FlowBlockDef {
    type: string;
    id: string;
    parent: {
        id: string;
    };
    parameters: FlowBlockParameterDef[];
    statements: FlowBlockStatementDef[];
}
export interface FlowBlockInputDef {
    id: string;
}

export interface FlowBlockStatementDef extends FlowBlockInputDef {
    children: string[];
}
export interface FlowBlockParameterDef extends FlowBlockInputDef {
    value: {
        block?: string | null;
        constant?: any;
    };
}