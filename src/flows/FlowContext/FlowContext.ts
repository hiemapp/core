import type { FlowScript } from '~/flows/Flow.types';
import FlowBlockContext from '../FlowBlockContext/FlowBlockContext';
import type Flow from '../Flow';
import Taskmanager from '~/lib/TaskManager';

export default class FlowContext {
    readonly flow: Flow;
    readonly script: FlowScript;
    readonly taskManager: Taskmanager;
    protected readonly blockCtxs: Record<string, FlowBlockContext>

    constructor(flow: Flow, script: FlowScript, blockCtxs: Record<string, FlowBlockContext>) {
        this.flow = flow;
        this.script = script;
        this.blockCtxs = blockCtxs;
        this.taskManager = new Taskmanager(`FLOW_${this.flow.getId()}`);
    }

    findBlock(blockId: string): FlowBlockContext {
        return this.blockCtxs[blockId];
    }
}