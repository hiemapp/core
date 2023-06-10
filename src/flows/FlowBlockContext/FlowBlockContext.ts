import type { Constructor } from '~types/helpers';
import type { FlowScriptBlock, FlowBlockCustomTaskData, FlowTaskData  } from '~/flows/Flow.types';
import type { FlowBlockManifest } from '~/flows/FlowBlockManifest.types'
import { logger } from '../../lib';
import FlowBlockStatementContext from './FlowBlockStatementContext';
import FlowBlockParameterContext from './FlowBlockParameterContext';
import FlowBlock from '../FlowBlock';
import ExtensionController from '~/extensions/ExtensionController';
import FlowContext from '../FlowContext/FlowContext';
import { PromiseAllObject } from '~/utils/Promise';
import { ensureFind } from '~/utils/object';
import Taskrunner from '~/lib/Taskrunner';

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

    isOfType(moduleClass: Constructor<FlowBlock>) {
        return this.typeInstance instanceof moduleClass;
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
        Taskrunner.registerTimedTask<FlowBlockCustomTaskData<TData>>(date, 'FLOW_TASK', {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    registerDelayedTask<TData = any>(msDelay: number, keyword: string, data?: TData) {
        Taskrunner.registerDelayedTask<FlowBlockCustomTaskData<TData>>(msDelay, 'FLOW_TASK', {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    registerRepeatingTask<TData = any>(msInterval: number, keyword: string, data?: TData) {
        Taskrunner.registerRepeatingTask<FlowBlockCustomTaskData<TData>>(msInterval, 'FLOW_TASK', {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    mount() {
        this.typeInstance.handleMount(this);
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

    protected serialize(): FlowTaskData['ctx'] {
        return {
            block: {
                type: this.def.type,
                id: this.def.id
            },
            flowId: this.root().flow.getId() 
        }
    }
}