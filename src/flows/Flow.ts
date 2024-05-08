import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import _ from 'lodash';
import FlowController from './FlowController';
import { FlowType, FlowBlockCustomTaskData, FlowBlocklyWorkspace } from './Flow.types';
import FlowBlockContext from './FlowBlockContext/FlowBlockContext';
import FlowTranspiler from './FlowTranspiler';
import FlowContext from './FlowContext/FlowContext';
import Taskrunner, { Task } from '../lib/Taskrunner';
import ExtensionController from '../extensions/ExtensionController';
import FlowBlock from './FlowBlock';
import Taskmanager from '~/lib/TaskManager';

export default class Flow extends ModelWithProps<FlowType> {
    protected context: { blocks: Record<string, FlowBlockContext>, flow: FlowContext };
    protected taskManager: Taskmanager;

    __modelConfig(): ModelWithPropsConfig<FlowType> {
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
    
    protected init() {
        this.taskManager = new Taskmanager(`flows.flow${this.getId()}`);
        this.taskManager.addHandler('FLOW_TASK', this.handleBlockCustomTask);
    }

    async reload(newWorkspace: FlowBlocklyWorkspace) {
        this.logger.debug('Reloading...');

        // Unmount all the blocks
        await Promise.all(Object.values(this.context.blocks).map(blockCtx => {
            blockCtx.unmount();
        }))
        
        // Delete all existing tasks
        await Promise.all(Taskrunner.index().map(t => {
            if (t.keyword === 'FLOW_TASK' && t.data.ctx.flowId === this.getId()) {
                Taskrunner.deleteTask(t.uuid);
            }
        }));

        this.setProp('blocklyWorkspace', newWorkspace);

        await this.load();
    }

    async load() {
        const transpiler = new FlowTranspiler();
        const script = transpiler.transpileWorkspace(this.getProp('blocklyWorkspace'));

        const blocks: Record<string, FlowBlockContext> = {};

        // Create flow context
        const flow = new FlowContext(this, script, blocks);

        // Create context for each block
        script.blocks.forEach(block => {
            blocks[block.id] = new FlowBlockContext(block.id, flow)
        })

        // Store the context
        this.context = { blocks, flow };

        // Mount all the blocks
        await Promise.all(Object.values(blocks).map(blockCtx => {
            return blockCtx.mount();
        }))  
    }

    getBlocks() {
        return Object.values(this.context.blocks);
    }

    protected handleBlockCustomTask(task: Task) {
        if (task.data.taskType !== 'CUSTOM') return;
        if (task.data.ctx.flowId !== this.getId()) return;

        try {
            const data = task.data;
            const { blocks } = this.context;
            const blockType = ExtensionController.findModule(FlowBlock, data.ctx.block.type);
            const blockCtx = blocks[data.ctx.block.id];

            const originalTask = {
                keyword: task.data.originalKeyword,
                data: task.data.originalData
            };

            blockType.prototype.handleTask(originalTask, blockCtx);
        } catch (err: any) {
            this.logger.error(err);
        }
    }

    execute() {
        const { blocks } = this.context;

        Object.values(blocks).forEach(block => {
            if (!block.hasParent()) {
                block.execute();
            }
        })
    }
}
