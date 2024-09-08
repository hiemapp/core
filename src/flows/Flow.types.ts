import { ModelWithPropsType } from '~/lib/ModelWithProps';
import { FlowBlockDef } from './FlowBlockDef.types';
import { BlocklySerializedWorkspace } from './BlocklyTranspiler';

export interface FlowType extends ModelWithPropsType {
    id: number,
    props: FlowProps,
    serializedProps: FlowProps
}

export interface FlowProps {
    id: number;
    name: string;
    icon: string;
    state: BlocklySerializedWorkspace;
    workspace: {
        json: FlowWorkspaceJSON
    }
}

export interface FlowWorkspaceJSON {
    fields: Record<'trigger'|'condition'|'action', {
        blocks: Array<{
            type: string;
        }>
    }>
}

export interface FlowTaskData {
    taskType: 'RUN' | 'REMOUNT' | 'CUSTOM',
    ctx: {
        flowId: number;
        block: {
            id: string;
            type: string;
        };
    };
}

export interface FlowDef {
    blocks: FlowBlockDef[];
}
