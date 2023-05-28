import type { FlowScript } from 'types';
import FlowBlockContext from '../FlowBlockContext/FlowBlockContext';
import type Flow from '../Flow';

export default class FlowContext {
    readonly flow: Flow;
    readonly script: FlowScript;
    protected readonly blocks: Record<string, FlowBlockContext>

    constructor(flow: Flow, script: FlowScript, blocks: Record<string, FlowBlockContext>) {
        this.flow = flow;
        this.script = script;
        this.blocks = blocks;
    }

    findBlock(blockId: string): FlowBlockContext {
        return this.blocks[blockId];
    }
}