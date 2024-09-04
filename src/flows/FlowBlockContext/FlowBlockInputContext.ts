import type { FlowBlockInputDef } from '~/flows/FlowBlockDef.types';
import type { FlowBlockInputLayout } from '~/flows/FlowBlockLayout.types'
import EventEmitter from 'events';
import FlowBlockContext from './FlowBlockContext';

export default abstract class FlowBlockInputContext<TDef extends FlowBlockInputDef, TLayout extends FlowBlockInputLayout> {
    readonly id: string;
    readonly events: EventEmitter;
    protected blockCtx: FlowBlockContext;
    protected def: TDef;
    protected layout: TLayout;

    constructor(
        blockCtx: FlowBlockContext,
        def: TDef,
        layout: TLayout
    ) {
        this.blockCtx = blockCtx;
        this.def = def;
        this.layout = layout;
        this.id = this.def.id;
        this.events = new EventEmitter();
    }
}