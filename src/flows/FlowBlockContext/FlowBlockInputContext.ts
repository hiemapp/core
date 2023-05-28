import type { FlowScriptBlock, FlowScriptBlockParameter, FlowScriptBlockStatement, FlowBlockManifest, FlowBlockManifestParameter, FlowBlockManifestStatement } from 'types';
import type FlowBlockContext from './FlowBlockContext';

export default abstract class FlowBlockInputContext {
    readonly id: string;
    protected block: FlowBlockContext;
    protected blockDef: FlowScriptBlock;
    protected blockManifest: FlowBlockManifest;
    protected abstract manifest: FlowBlockManifestParameter | FlowBlockManifestStatement;
    protected abstract def: FlowScriptBlockParameter | FlowScriptBlockStatement;

    constructor(
        id: string, 
        block: FlowBlockContext, 
        blockDef: FlowScriptBlock, 
        blockManifest: FlowBlockManifest
    ) {
        this.id = id;
        this.block = block;
        this.blockDef = blockDef;
        this.blockManifest = blockManifest;

        this.init();
    }

    abstract init(): void;
}