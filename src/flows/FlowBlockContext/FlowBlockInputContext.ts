import type { FlowScriptBlockParameter, FlowScriptBlockStatement } from '~/flows/Flow.types';
import type { FlowBlockLayoutParameter, FlowBlockLayoutStatement } from '~/flows/FlowBlockLayout.types'
import type FlowBlockContext from './FlowBlockContext';

export default abstract class FlowBlockInputContext {
    readonly id: string;
    protected blockCtx: FlowBlockContext;
    protected abstract layout: FlowBlockLayoutParameter | FlowBlockLayoutStatement;
    protected abstract def: FlowScriptBlockParameter | FlowScriptBlockStatement;

    constructor(
        id: string, 
        blockCtx: FlowBlockContext
    ) {
        this.id = id;
        this.blockCtx = blockCtx;

        this.init();
    }

    protected abstract init(): void;
}