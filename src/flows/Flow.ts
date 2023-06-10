import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import _ from 'lodash';
import FlowController from './FlowController';
import { FlowBlocklyWorkspace, FlowProps, FlowBlockCustomTaskData } from './Flow.types';
import FlowBlockContext from './FlowBlockContext/FlowBlockContext';
import FlowTranspiler from './FlowTranspiler';
import FlowContext from './FlowContext/FlowContext';
import Taskrunner, { TaskrunnerTaskEvent } from '../lib/Taskrunner';
import ExtensionController from '../extensions/ExtensionController';
import FlowBlock from './FlowBlock';

export default class Flow extends ModelWithProps<FlowProps> {
    _getConfig(): ModelWithPropsConfig<FlowProps, FlowProps> {
        return {
            controller: FlowController,
            defaults: {
                name: '',
                icon: '',
                blocklyWorkspace: {
                    languageVersion: 0,
                    blocks: []
                }
            }
        }
    }

    updateWorkspace(wpc: FlowBlocklyWorkspace) {
        this.setProp('blocklyWorkspace', wpc);
        this.reload();
    }

    reload() { 
        console.log('reload!');
        const { blocks } = this.createContext();

        // Remove all existing tasks for this flow
        const tasks = Taskrunner.indexTasks();
        tasks.forEach(t => {
            if(t.keyword === 'FLOW_TASK' && t.data.ctx.flowId === this.getId()) {
                Taskrunner.deleteTask(t.uuid);
            }
        })
        
        // Mount all the blocks
        Object.values(blocks).forEach(block => {
            block.mount();
        })
    }

    init() {
        Taskrunner.on('task', e => this.handleBlockCustomTask(e));
    }

    getBlocks() {
        return Object.values(this.createContext().blocks);
    }
    
    protected createContext() {
        const transpiler = new FlowTranspiler();
        const script = transpiler.transpileWorkspace(this.getProp('blocklyWorkspace'));

        const blocks: Record<string, FlowBlockContext> = {};

        // Create flow context
        const flow = new FlowContext(this, script, blocks);

        // Create context for each block
        script.blocks.forEach(block => {
            blocks[block.id] = new FlowBlockContext(block.id, flow)
        })

        return { blocks, flow };
    }

    protected handleBlockCustomTask(e: TaskrunnerTaskEvent<FlowBlockCustomTaskData>) {
        if(e.task.data.taskType !== 'CUSTOM') return;
        if(e.task.data.ctx.flowId !== this.getId()) return;

        try {
            const data = e.task.data;
            const { blocks } = this.createContext();
            const blockType = ExtensionController.findModule(FlowBlock, data.ctx.block.type);
            const blockCtx = blocks[data.ctx.block.id];

            const task = {
                keyword: e.task.data.originalKeyword,
                data: e.task.data.originalData
            };
            
            blockType.prototype.handleTask(task, blockCtx);
        } catch(err: any) {
            this.logger.error(err);
        }
    }

    execute() {
        const { blocks } = this.createContext();

        Object.values(blocks).forEach(block => {
            if(!block.hasParent()) {
                block.execute();
            }
        })
    }
}
