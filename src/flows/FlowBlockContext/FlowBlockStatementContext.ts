import type { FlowBlockManifestStatement, FlowScriptBlockStatement } from 'types';
import type FlowBlockContext from './FlowBlockContext';
import FlowBlockInputContext from './FlowBlockInputContext';
import { ensureFind } from '~/utils/object';

export default class FlowBlockStatementContext extends FlowBlockInputContext {
    protected def: FlowScriptBlockStatement;
    protected manifest: FlowBlockManifestStatement;
    protected pointerIndex: number = 0;
    protected isExecutionStopped: boolean = false;

    init() {
        this.def = ensureFind(this.blockDef.statements!, s => s.id === this.id);
        this.manifest = ensureFind(this.blockManifest.statements!, s => s.id === this.id);
    }

    async execute(pointerIndex: number = 0) {
        this.movePointer(pointerIndex);

        while(!this.isExecutionStopped && this.pointerIndex < this.blocks().length) {
            await this.executeBlock(this.pointerIndex);
            this.pointerIndex++;
        }
    }

    async executeBlock(index: number): Promise<boolean> {
        // Get the block to execute
        const block = this.blocks()[index];

        // Check if the block exists
        if(!block) {
            return false;
        }

        // Execute the block
        await block.execute();

        return true;
    }

    blocks(): FlowBlockContext[] {
        return this.def.children.map(id => this.block.root().findBlock(id))
    }

    stopExecution(isExecutionStopped: boolean = true) {
        this.isExecutionStopped = isExecutionStopped;
    }

    startExecution(pointerIndex: number = this.pointerIndex) {
        this.isExecutionStopped = false;
        return this.execute(pointerIndex);
    }

    movePointer(index: number) {
        this.pointerIndex = index;
    }

    resetPointer() {
        this.pointerIndex = 0;
    }

    currentPointer() {
        return this.pointerIndex;
    }

    protected findDef() {
        const def = this.blockDef.statements.find(s => s.id === this.id);
        if(!def) {
            throw new Error(`Definition for statement '${this.id}' not found.`);
        }
        return def;
    }
}