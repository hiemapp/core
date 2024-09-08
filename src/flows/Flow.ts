import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import _ from 'lodash';
import FlowController from './FlowController';
import { FlowType } from './Flow.types';
import FlowBlockContext from './FlowBlockContext/FlowBlockContext';
import BlocklyTranspiler, { type BlocklySerializedWorkspace } from './BlocklyTranspiler';
import FlowContext from './FlowContext/FlowContext';
import Taskrunner, { Task } from '../lib/Taskrunner';
import ExtensionController from '../extensions/ExtensionController';
import FlowBlock from './FlowBlock';
import Taskmanager from '~/lib/TaskManager';

export default class Flow extends ModelWithProps<FlowType> {
    taskManager: Taskmanager;
    protected context: { blocks: Record<string, FlowBlockContext>, flow: FlowContext };

    __modelConfig(): ModelWithPropsConfig<FlowType> {
        return {
            controller: FlowController,
            defaults: {
                name: '',
                icon: '',
                state: {
                    languageVersion: 0,
                    blocks: []
                },
                workspace: {
                    json: {
                        fields: {
                            trigger: { blocks: [] },
                            condition: { blocks: [] },
                            action: { blocks: []}
                        }
                    }
                }
            }
        }
    }
    
    async __init() {
        this.taskManager = new Taskmanager(`flows.flow${this.id}`);
        this.taskManager.addHandler('FLOW_TASK', this.handleBlockCustomTask.bind(this));
            
        await this.load().catch(err => {
            this.logger.error(err);
        })
    }

    async update(newState: BlocklySerializedWorkspace) {
        this.logger.debug('Reloading...');

        // Unload all the blocks
        await Promise.all(this.getBlocks().map(block => block.unload()))
        
        // Delete all existing tasks
        await Promise.all(Taskrunner.listTasks().map(t => {
            if (t.keyword === 'FLOW_TASK' && t.data.ctx.flowId === this.id) {
                return Taskrunner.deleteTask(t.uuid);
            }
        }));

        this.setProp('state', newState);
        await this.load();

        // Mount all the blocks
        await Promise.all(this.getBlocks().map(block => block.mount()))
    }

    async load() {
        // Create context
        this.createContext();

        // Load all the blocks
        await Promise.all(this.getBlocks().map(block => block.load()))
        this.logger.debug('Loaded succesfully.');
        return;
    }

    getBlocks() {
        if(!this.context?.blocks) return [];
        return Object.values(this.context.blocks);
    }

    protected createContext() {
        const transpiler = new BlocklyTranspiler();
        this.context = transpiler.createContext(this, this.getProp('state'));
    }

    protected handleBlockCustomTask(task: Task) {
        if (task.data.taskType !== 'CUSTOM') return;
        if (task.data.ctx.flowId !== this.id) return;

        try {
            const data = task.data;
            const block = ExtensionController.findModule(FlowBlock, data.ctx.block.type);
            const blockCtx = this.context.blocks[data.ctx.block.id];

            const originalTask = {
                keyword: task.data.originalKeyword,
                data: task.data.originalData
            };

            block.emit('task', blockCtx, originalTask);
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
