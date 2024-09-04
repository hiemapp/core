import type { FlowDef } from '~/flows/Flow.types';
import FlowBlockContext from '../FlowBlockContext/FlowBlockContext';
import type Flow from '../Flow';
import _ from 'lodash';

export default class FlowContext {
    readonly flow: Flow;
    readonly def: FlowDef;
    protected readonly blocks: Record<string, FlowBlockContext>;
    protected meta: Record<string, any> = {};

    constructor(flow: Flow, def: FlowDef, blocks: Record<string, FlowBlockContext>) {
        this.flow = flow;
        this.def = def;
        this.blocks = blocks;
    }

    getBlock(blockId: string): FlowBlockContext {
        return this.blocks[blockId];
    }

    setMeta(keypath: string, value: any) {
        return _.set(this.meta, keypath, value);
    }

    getMeta(keypath: string) {
        return _.get(this.meta, keypath);
    }
}