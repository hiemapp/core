import { Constructor, FlowScriptBlock, FlowBlockManifest, TaskrunnerFlowTaskData } from 'types';
import { logger } from '../../lib';
import FlowBlockStatementContext from './FlowBlockStatementContext';
import FlowBlockParameterContext from './FlowBlockParameterContext';
import FlowBlock from '../FlowBlock';
import ExtensionController from '~/extensions/ExtensionController';
import FlowContext from '../FlowContext/FlowContext';
import { PromiseAllObject } from '~/utils/Promise';
import { ensureFind } from '~/utils/object';
import Taskrunner, { TaskrunnerTask } from '~/lib/Taskrunner';

export interface FlowBlockContextTimedTaskEvent {
    keyword: string,
    ctx: FlowBlockContext
}

export default class FlowBlockContext {
    protected id: string;
    protected typeInstance: FlowBlock;
    protected flow: FlowContext;
    protected def: FlowScriptBlock;
    protected manifest: FlowBlockManifest;
    protected _parameters: Record<string, FlowBlockParameterContext> = {};
    protected _statements: Record<string, FlowBlockStatementContext> = {};

    constructor(id: string, flow?: FlowContext) {
        this.id = id;

        if(!flow) return;
        this.flow = flow;

        this.def = this.findDef();
        this.typeInstance = this.findType().prototype;
        this.manifest = this.typeInstance.getManifest();

        // Create parameter contexts
        this.def.parameters.forEach(p => {
            this._parameters[p.id] = new FlowBlockParameterContext(p.id, this, this.def, this.manifest);
        })

        // Create statement contexts
        this.def.statements.forEach(s => {
            this._statements[s.id] = new FlowBlockStatementContext(s.id, this, this.def, this.manifest);
        })
    }

    async execute() {
        const result = await this.typeInstance.run(this);
        logger.debug(`Executed ${this.id} (type:${this.def.type}; output: ${result})`);
        return result;
    }

    root() {
        return this.flow;
    }

    hasParent() {
        return (typeof this.parentBlock() !== 'undefined');
    }

    parentBlock() {
        return this.flow.findBlock(this.def.parent.id);
    }

    index(): number {
        return this.siblings().indexOf(this);
    }

    parameter(parameterId: string): FlowBlockParameterContext {
        return this._parameters[parameterId];
    }

    parameters(): FlowBlockParameterContext[] {
        return Object.values(this._parameters);
    }

    async allParameterValues(): Promise<Record<string, any>> {
        const promises: Record<string, any> = {};

        this.parameters().forEach(p => {
            promises[p.id] = p.value();
        })

        return await PromiseAllObject(promises);
    }

    thisStatement(): FlowBlockStatementContext {
        return ensureFind(this.parentBlock()!.statements(), s => s.blocks().includes(this));
    }

    statement(statementId: string): FlowBlockStatementContext {
        return this._statements[statementId];
    }
    
    statements(): FlowBlockStatementContext[] {
        return Object.values(this._statements);
    }

    siblings() {
        const stmt = this.thisStatement();
        return stmt ? stmt.blocks() : [];
    }

    registerTimedTask<TData = any>(date: Date, keyword: string, data?: TData) {
        Taskrunner.registerTimedTask<TaskrunnerFlowTaskData<TData>>(date, 'FLOW_BLOCK_CUSTOM_TASK', {
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    registerDelayedTask<TData = any>(msDelay: number, keyword: string, data?: TData) {
        const date = new Date(Date.now() + msDelay);
        this.registerTimedTask<TData>(date, keyword, data);
    }

    reloadAt(date: Date) {
        // Find all existing tasks for this block id
        const existingTasks = Taskrunner.findAll('FLOW_BLOCK_RELOAD_TASK').filter(
            (t: TaskrunnerTask<TaskrunnerFlowTaskData>) => t.data.ctx.block.id);

        // Remove the existing tasks
        existingTasks.forEach(task => {
            Taskrunner.deleteTask(task.uuid);
        })

        // Register the new task
        this.registerTimedTask(date, 'FLOW_BLOCK_RELOAD_TASK', {
            ctx: this.serialize()
        })
    }

    reloadNow() {
        this.typeInstance.reload(this);
    }

    protected findDef(): FlowScriptBlock {
        const def = this.flow.script.blocks.find(b => b.id === this.id);

        if(!def) {
            throw new Error(`Definition for flow block '${this.id}' not found.`);
        }
        
        return def;
    }

    protected findType(): Constructor<FlowBlock> {
        return ExtensionController.findModule(FlowBlock, this.def.type);
    }

    protected serialize(): TaskrunnerFlowTaskData['ctx'] {
        return {
            block: {
                type: this.def.type,
                id: this.def.id
            },
            flowId: this.root().flow.getId() 
        }
    }
}