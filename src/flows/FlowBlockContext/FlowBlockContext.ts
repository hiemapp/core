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
import Manifest from '~/utils/Manifest';
import { FlowBlockLayout } from '../FlowBlockLayout.types';

export interface FlowBlockContextTimedTaskEvent {
    keyword: string,
    ctx: FlowBlockContext
}

export default class FlowBlockContext {
    public def: FlowScriptBlock;
    public manifest: Manifest<FlowBlockManifest>;
    public layout: Manifest<FlowBlockLayout>;

    protected id: string;
    protected type: typeof FlowBlock;
    protected flowCtx: FlowContext;
    protected _parameters: Record<string, FlowBlockParameterContext> = {};
    protected _statements: Record<string, FlowBlockStatementContext> = {};

    constructor(id: string, flow?: FlowContext) {
        this.id = id;

        if(!flow) return;
        this.flowCtx = flow;

        this.init();
    }

    protected init() {   
        this.def = this.findDef();
        this.type = this.findType();
        this.manifest = this.type.manifest;
        this.layout = new Manifest(this.type.layout());

        // Create parameter contexts
        this.def.parameters.forEach(p => {
            this._parameters[p.id] = new FlowBlockParameterContext(p.id, this);
        })

        // Create statement contexts
        this.def.statements.forEach(s => {
            this._statements[s.id] = new FlowBlockStatementContext(s.id, this);
        })

        return this;
    }

    async execute() {
        try {
            let result = this.type.prototype.run(this);

            if(result instanceof Promise) {
                result = await result.catch((err: any) => {
                    this.flowCtx.flow.logger.error(`Error running block ${this.def.id}:`, { err });
                });
            }
            
            logger.debug(`Executed ${this.id} (type:${this.def.type}; output: ${result})`);
            return result;
        } catch(err: any) {
            this.flowCtx.flow.logger.error(`Error running block ${this.def.id}:`, { err });
        }
    }

    root() {
        return this.flowCtx;
    }

    isOfType(moduleClass: Constructor<FlowBlock>) {
        return this.type.prototype instanceof moduleClass;
    }

    hasParent() {
        return (typeof this.parentBlock() !== 'undefined');
    }

    parentBlock() {
        return this.flowCtx.findBlock(this.def.parent.id);
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

    registerRepeatingTask<TData = any>(intervalSeconds: number, keyword: string, data?: TData) {
        Taskrunner.registerRepeatingTask<FlowBlockCustomTaskData<TData>>(intervalSeconds, 'FLOW_TASK', {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    mount() {
        this.type.prototype.mount(this);
    }

    protected findDef(): FlowScriptBlock {
        const def = this.flowCtx.script.blocks.find(b => b.id === this.id);

        if(!def) {
            throw new Error(`Definition for flow block '${this.id}' not found.`);
        }
        
        return def;
    }

    protected findType() {
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