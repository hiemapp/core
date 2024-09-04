import type { FlowBlockDef } from '../FlowBlockDef.types';
import type { FlowBlockCustomTaskData, IFlowBlockManifest } from '~/flows/FlowBlock.types'
import FlowBlockStatementContext from './FlowBlockStatementContext';
import FlowBlockParameterContext from './FlowBlockParameterContext';
import FlowBlock from '../FlowBlock';
import ExtensionController from '~/extensions/ExtensionController';
import FlowContext from '../FlowContext/FlowContext';
import { PromiseAllObject } from '~/utils/Promise';
import { ensureFind } from '~/utils/object';
import Manifest from '~/utils/Manifest';
import { FlowTaskData } from '../Flow.types';
import FlowBlockLayout from '../FlowBlockLayout';
import _ from 'lodash';
import Model from '~/lib/Model';
import type { Device } from '~/devices';
import type { Flow } from '~/flows';
import type { User } from '~/users';
import type { Extension } from '~/extensions';

export type FlowblockContextHandlerName = 'CANCEL';
export type FlowBlockContextFunctionCallback = () => unknown;

export interface FlowBlockContextTimedTaskEvent {
    keyword: string,
    ctx: FlowBlockContext
}

export interface FlowBlockContextListener { 
    model: Model<any>, 
    eventName: string, 
    callback: (...args: any[]) => unknown; 
}

export interface FlowBlockParameterValues {
    DEVICE: Device;
    FLOW: Flow;
    USER: User;
    EXTENSION: Extension;
    [key: string]: any
}

export default class FlowBlockContext {
    public readonly def: FlowBlockDef;
    public readonly manifest: Manifest<IFlowBlockManifest>;
    public readonly layout: FlowBlockLayout;
    public readonly flowCtx: FlowContext;

    protected id: string;
    protected handlers: Record<FlowblockContextHandlerName, FlowBlockContextFunctionCallback | undefined> = {} as any;
    protected meta: Record<string, any> = {};
    protected block: FlowBlock;
    protected listeners: FlowBlockContextListener[] = [];
    protected _parameters: Record<string, FlowBlockParameterContext> = {};
    protected _statements: Record<string, FlowBlockStatementContext> = {};

    // protected _memo_rootBlock?: FlowBlockContext;
    // protected _memo_getHandler: Record<FlowblockContextHandlerName, FlowBlockContextFunctionCallback | undefined> = {} as any;

    constructor(id: string, flowCtx?: FlowContext) {
        this.id = id;

        if(!flowCtx) return;
        this.flowCtx = flowCtx;

        this.def = this.findDef();
        this.block = ExtensionController.findModule(FlowBlock, this.def.type)
        this.manifest = this.block.getManifest();
        this.layout = this.block.$module.methods.getLayout();

        // Create parameter contexts
        this.layout.getParameters().forEach(layout => {
            const def = this.def.parameters.find(p => p.id === layout.id);
            if(!def) throw `Missing parameter '${layout.id}' in definition of block '${this.id}' of type '${this.def.type}'.`;
            this._parameters[layout.id] = new FlowBlockParameterContext(this, def, layout);
        })

        // Create statement contexts
        this.layout.getStatements().forEach(layout => {
            const def = this.def.statements.find(s => s.id === layout.id);
            if(!def) return;
            this._statements[layout.id] = new FlowBlockStatementContext(this, def, layout);
        })

        // Memoize methods
        this.parents = _.memoize(this.parents.bind(this));
    }

    async execute() {
        try {
            const startTime = Date.now();
            let output = this.block.$module.methods.callProvider('run', [ this ]);

            if(output instanceof Promise) {
                output = await output.catch((err: any) => {
                    this.flowCtx.flow.logger.error(`Error running block ${this.def.id}:`, err);
                });
            }
            
            const endTime = Date.now();
            // this.flowCtx.flow.logger.debug(`Executing block ${this.id}`, { type: this.def.type, output }, 'took', endTime-startTime, 'ms');
            return output;
        } catch(err: any) {
            this.flowCtx.flow.logger.error(`Error running block ${this.def.id}:`, err);
        }
    }

    hasParent(): this is { parentBlock(): FlowBlockContext }{
        return (typeof this.parentBlock() !== 'undefined');
    }
    
    rootBlock() {
        const parents = this.parents();
        return parents[parents.length-1] ?? this;
    }

    parents() {
        const parents: FlowBlockContext[] = [];
        
        let parentBlock = this.parentBlock();
        while(parentBlock) {
            parents.push(parentBlock);

            if(!parentBlock.hasParent()) break;
            parentBlock = parentBlock.parentBlock();
        }

        return parents;
    }

    parentBlock() {
        if(!this.def.parent.id) return null;
        return this.flowCtx.getBlock(this.def.parent.id);
    }

    flow() {
        return this.flowCtx;
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

    async allParameterValues(): Promise<FlowBlockParameterValues> {
        const promises: Record<string, any> = {};

        this.parameters().forEach(p => {
            promises[p.id] = p.value();
        })

        return await PromiseAllObject(promises);
    }

    currentStatement(): FlowBlockStatementContext {
        return ensureFind(this.parentBlock()!.statements(), s => s.blocks().includes(this));
    }

    addListener<TModel extends Model<any>>(model: TModel, eventName: string, callback: (data: any) => unknown) {
        model.on(eventName as any, callback);
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
        let currentBlock: FlowBlockContext|null = this;

        while(currentBlock && typeof handler !== 'function') {
            handler = currentBlock.handlers[name];
            currentBlock = currentBlock.parentBlock();
        }

        return handler;
    }

    setMeta(keypath: string, value: any) {
        return _.set(this.meta, keypath, value);
    }

    getMeta(keypath: string) {
        return _.get(this.meta, keypath);
    }

    addTimedTask<TData = any>(date: Date, keyword: string, data?: TData) {
        this.flowCtx.flow.taskManager.addTimedTask<FlowBlockCustomTaskData<TData>>('FLOW_TASK', date, {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    addDelayedTask<TData = any>(msDelay: number, keyword: string, data?: TData) {
        this.flowCtx.flow.taskManager.addDelayedTask<FlowBlockCustomTaskData<TData>>('FLOW_TASK', msDelay, {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    addRepeatingTask<TData = any>(interval: string, keyword: string, data?: TData) {
        this.flowCtx.flow.taskManager.addRepeatingTask<FlowBlockCustomTaskData<TData>>('FLOW_TASK', interval, {
            taskType: 'CUSTOM',
            originalKeyword: keyword,
            originalData: data,
            ctx: this.serialize()
        })
    }

    load() {
        return this.block.emit('load', this);
    }

    mount() {
        return this.block.emit('mount', this);
    }

    unload() {
        this.listeners.forEach(({ model, eventName, callback }) => {
            model.off(eventName, callback);
        })

        return this.block.emit('unload', this);
    }

    protected findDef(): FlowBlockDef {
        const def = this.flowCtx.def.blocks.find(b => b.id === this.id);

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
            flowId: this.flowCtx.flow.id 
        }
    }
}