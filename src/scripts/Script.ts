import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import _ from 'lodash';
import { ScriptType } from './Script.types';
import ScriptController from './ScriptController';
import TaskManager from '~/lib/TaskManager';
import vm from 'vm';
import { fork } from 'child_process';
import ScriptApi from './ScriptApi';

export default class Script extends ModelWithProps<ScriptType> {
    taskManager: TaskManager;

    protected _context: vm.Context;

    __modelConfig(): ModelWithPropsConfig<ScriptType> {
        return {
            controller: ScriptController,
            defaults: {
                name: '',
                icon: '',
                code: ''
            }
        }
    }

    async __init() {
        this.taskManager = new TaskManager(`scripts.${this.id}`);
        this._context = vm.createContext(this._getContext());
    }

    async unload() {
        // Delete all tasks from this script
        await this.taskManager.deleteAllTasks();
    }

    async load() {
        this._runInContext();
    }

    async reload() {
        this.logger.debug('Reloading...');
        
        await this.unload();
        await this.load();
    }

    protected _runInContext(code?: string) {
        code = code ?? this.getProp('code');

        try {
            const script = new vm.Script(`
                (async function () {
                    ${code}
                })();
            `);

            script.runInContext(this._context);
        } catch (error) {
            this.logger.error(error);
            this.emit('error', { error });
        }
    }

    protected _getContext(): any {
        const api = new ScriptApi(this);

        return {
            ...global,
            console: console,
            $script: this,
            home: api.getObject(),
            sleep: (time: number) => new Promise<void>(resolve => {
                setTimeout(() => {
                    resolve();
                }, time*1000)
            })
        };
    }
    
    async updateCode(code: string) {
        this.setProp('code', code);
        await this.reload();
    }
}
