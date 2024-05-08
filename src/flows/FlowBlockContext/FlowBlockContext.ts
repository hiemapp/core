import type { Constructor } from '~types/helpers';
import type { FlowScriptBlock, FlowBlockCustomTaskData, FlowTaskData  } from '~/flows/Flow.types';
import type { FlowBlockManifest } from '~/flows/FlowBlockManifest.types'
import FlowBlockStatementContext from './FlowBlockStatementContext';
import FlowBlockParameterContext from './FlowBlockParameterContext';
import FlowBlock from '../FlowBlock';
import ExtensionController from '~/extensions/ExtensionController';
import FlowContext from '../FlowContext/FlowContext';
import { PromiseAllObject } from '~/utils/Promise';
import { ensureFind } from '~/utils/object';
import Manifest from '~/utils/Manifest';
import { FlowBlockLayout } from '../FlowBlockLayout.types';
import _ from 'lodash';
import type Model from '~/lib/Model';
import { ModelEventCallback } from '~/lib/ModelEvent';

export type FlowblockContextHandlerName = 'CANCEL';
export type FlowBlockContextFunctionCallback = () => unknown;
type henk<T> = T extends Model<infer B> ? B : never;

export interface FlowBlockContextTimedTaskEvent {
    keyword: string,
    ctx: FlowBlockContext
}

export interface FlowBlockContextListener { 
    model: Model<any>, 
    eventName: string, 
    callback: ModelEventCallback 
}

export default class FlowBlockContext {
    public readonly def: FlowScriptBlock;
    public readonly manifest: Manifest<FlowBlockManifest>;
    public readonly layout: Manifest<FlowBlockLayout>;
    public readonly flowCtx: FlowContext;

    public isMounted: boolean = false;

    protected id: string;
    protected handlers: Record<FlowblockContextHandlerName, FlowBlockContextFunctionCallback | undefined> = {} as any;
    protected variables: Record<string, any> = {};
    protected instance: FlowBlock;
    protected listeners: FlowBlockContextListener[] = [];
    protected _parameters: Record<string, FlowBlockParameterContext> = {};
    protected _statements: Record<string, FlowBlockStatementContext> = {};

    // protected _memo_rootBlock?: FlowBlockContext;
    // protected _memo_getHandler: Record<FlowblockContextHandlerName, FlowBlockContextFunctionCallback | undefined> = {} as any;

    constructor(id: string, flow?: FlowContext) {
        this.id = id;

        if(!flow) return;
        this.flowCtx = flow;

        const def = this.findDef();
        const type = ExtensionController.findModule(FlowBlock, def.type)

        this.def = def;
        this.instance = new type();
        this.manifest = type.manifest;
        this.layout = new Manifest(type.layout());

        // Create parameter contexts
        this.def.parameters.forEach(p => {
            this._parameters[p.id] = new FlowBlockParameterContext(p.id, this);
        })

        // Create statement contexts
        this.def.statements.forEach(s => {
            this._statements[s.id] = new FlowBlockStatementContext(s.id, this);
        })

        // Memoize methods
        this.rootBlock = _.memoize(this.rootBlock.bind(this));
    }

    async execute() {
        try {
            let result = this.instance.run(this);

            if(result instanceof Promise) {
                result = await result.catch((err: any) => {
                    this.flowCtx.flow.logger.error(`Error running block ${this.def.id}:`, err);
                });
            }
            
            this.flowCtx.flow.logger.debug(`Executed ${this.id} (type:${this.def.type}; output: ${result})`);
            return result;
        } catch(err: any) {
            this.flowCtx.flow.logger.error(`Error running block ${this.def.id}:`, err);
        }
    }

    hasParent() {
        return (typeof this.parentBlock() !== 'undefined');
    }

    rootBlock() {
        let rootBlock = this.parentBlock();

        while(rootBlock.hasParent()) {
            rootBlock = rootBlock.parentBlock();
        }

        return rootBlock;
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

    currentStatement(): FlowBlockStatementContext {
        return ensureFind(this.parentBlock()!.statements(), s => s.blocks().includes(this));
    }

    listen<TModel extends Model<any>, TEventName extends Parameters<TModel['on']>[0]>(model: TModel, eventName: TEventName, callback: ModelEventCallback<any>) {
        model.on(eventName, callback);
        this.listeners.push({ model, eventName, callback });
    }

    statement(statementId: string): FlowBlockStatementContext {
        return this._statements[statementId];
    }
    
    statements(): FlowBlockStatementContext[] {
        return Object.values(this._statements);
    }

    siblings() {
        const stmt = this.currentStatement();
        return stmt ? stmt.blocks() : [];
    }

    registerHandler(name: FlowblockContextHandlerName, callback: FlowBlockContextFunctionCallback) {
        this.handlers[name] = callback;
    }
    
    invokeHandler(name: FlowblockContextHandlerName) {
        try {
            const handler = this.getHandler(name);

            if(typeof handler === 'function') {
                this.flowCtx.flow.logger.debug(`Invoking '${name}' handler of block '${this.id}'.`);
                handler!();
                return true;
            }

            throw new Error('Handler not found.');
        } catch(err: any) {
            this.flowCtx.flow.logger.debug(`Error invoking '${name}' handler of block '${this.id}':`, err);
        }

        return false;
    }

    getHandler(name: FlowblockContextHandlerName): FlowBlockContextFunctionCallback | undefined {
        let handler: FlowBlockContextFunctionCallback | undefined;
        let currentBlock: FlowBlockContext = this;

        while(currentBlock && typeof handler !== 'function') {
            handler = currentBlock.handlers[name];
            currentBlock = currentBlock.parentBlock();
        }

        return handler;
    }

    setVariable(name: string, value: any) {
        this.variables[name] = value;
    }

    getVariable(name: string) {
        let value;
        let currentBlock: FlowBlockContext = this;

        while(currentBlock && typeof value !== 'function') {
            value = currentBlock.variables[name];
            currentBlock = currentBlock.parentBlock();
        }

        return value;
    }

    addTimedTask<TData = any>(date: Date, keyword: string, data?: TData) {
        this.flowCtx.taskManager.addTimedTask<FlowBlockCustomTaskData<TData>>('FLOW_TASK', date, {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    addDelayedTask<TData = any>(msDelay: number, keyword: string, data?: TData) {
        this.flowCtx.taskManager.addDelayedTask<FlowBlockCustomTaskData<TData>>('FLOW_TASK', msDelay, {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    addRepeatingTask<TData = any>(interval: string, keyword: string, data?: TData) {
        this.flowCtx.taskManager.addRepeatingTask<FlowBlockCustomTaskData<TData>>('FLOW_TASK', interval, {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    mount() {
        this.isMounted = true;
        this.instance.mount(this);
    }

    unmount() {
        console.log(this.listeners);
        this.listeners.forEach(({ model, eventName, callback }, i) => {
            model.off(eventName, callback);
            delete this.listeners[i];
        });

        this.isMounted = false;
        this.instance.unmount(this);
    }

    protected findDef(): FlowScriptBlock {
        const def = this.flowCtx.script.blocks.find(b => b.id === this.id);

        if(!def) {
            throw new Error(`Definition for block '${this.id}' not found.`);
        }
        
        return def;
    }

    protected serialize(): FlowTaskData['ctx'] {
        return {
            block: {
                type: this.def.type,
                id: this.def.id
            },
            flowId: this.flowCtx.flow.getId() 
        }
    }
}