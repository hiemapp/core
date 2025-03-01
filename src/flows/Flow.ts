import ModelWithProps from '../lib/ModelWithProps';
import _ from 'lodash';
import { FlowType } from './Flow.types';
import FlowBlockContext from './FlowBlockContext/FlowBlockContext';
import BlocklyTranspiler, { type BlocklySerializedWorkspace } from './BlocklyTranspiler';
import FlowContext from './FlowContext/FlowContext';
import ExtensionController from '../extensions/ExtensionController';
import FlowBlock from './FlowBlock';
import TaskManager from '~/lib/TaskManager';
import { z } from 'zod';
import Task from '~/tasks/Task';

export default class Flow extends ModelWithProps<FlowType> {
    protected $schema = z.object({
        id: z.number(),
        name: z.string().nullable(),
        icon: z.string().nullable(),
        state: z.object({}).default({})
    })

    taskManager: TaskManager;
    protected context: { blocks: Record<string, FlowBlockContext>, flow: FlowContext };
    
    async __init() {
        this.taskManager = new TaskManager(`flows.${this.id}`);
        this.taskManager.addHandler('FLOW_TASK', this.handleBlockCustomTask.bind(this));
            
        await this.load().catch(err => {
            this.logger.error(err);
        })
    }

    async update(newState: BlocklySerializedWorkspace) {
        // Unload all the blocks
        this.logger.debug('Unloading blocks...');
        await Promise.all(this.getBlocks().map(block => block.unload()))
        
        // Delete all existing tasks
        this.logger.debug('Deleting tasks...');
        await this.taskManager.deleteAllTasks();

        this.setProp('state', newState);
        await this.load();

        // Mount all the blocks
        this.logger.debug('Mounting blocks...');
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
        const data = task.getData();
        if (data.taskType !== 'CUSTOM') return;
        if (data.ctx.flowId !== this.id) return;

        try {
            const block = ExtensionController.findModule(FlowBlock, data.ctx.block.type);
            const blockCtx = this.context.blocks[data.ctx.block.id];

            const originalTask = {
                keyword: data.originalKeyword,
                data: data.originalData
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
