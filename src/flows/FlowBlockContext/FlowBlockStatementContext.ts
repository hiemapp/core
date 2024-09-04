import type { FlowBlockStatementDef } from '~/flows/FlowBlockDef.types';
import type { IFlowBlockLayout_statement } from '~/flows/FlowBlockLayout.types'
import type FlowBlockContext from './FlowBlockContext';
import FlowBlockInputContext from './FlowBlockInputContext';

export default class FlowBlockStatementContext extends FlowBlockInputContext<FlowBlockStatementDef, IFlowBlockLayout_statement> {
    protected pointerIndex: number = 0;
    protected isExecutionStopped: boolean = false;

    async execute(pointerIndex: number = 0) {
        this.events.emit('execute');
        this.movePointer(pointerIndex);

        while(!this.isExecutionStopped) {
            await this.executeBlock(this.pointerIndex);

            if(this.pointerIndex < this.blocks().length) {
                this.pointerIndex++;
            } else {
                this.events.emit('end');
                break;
            }
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
        return this.def.children.map(id => this.blockCtx.flowCtx.getBlock(id))
    }
    
    executionStopped() {
        return this.isExecutionStopped;
    }

    stopExecution(isExecutionStopped: boolean = true) {
        this.isExecutionStopped = isExecutionStopped;
        this.events.emit('stop');
    }

    resumeExecution(pointerIndex: number = this.pointerIndex) {
        this.isExecutionStopped = false;
        this.events.emit('resume');
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
        const def = this.blockCtx.def.statements.find(s => s.id === this.id);
        if(!def) {
            throw new Error(`Definition for statement '${this.id}' not found.`);
        }
        return def;
    }
}