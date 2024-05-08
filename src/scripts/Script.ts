import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import _ from 'lodash';
import ScriptController from './ScriptController';
import type { ScriptType } from './Script.types';
import TaskManager from '~/lib/TaskManager';
import vm from 'vm';
import ScriptApi from './api/ScriptApi';

export type ScriptMethodName = 'mount' | 'unmount' | 'start' | 'stop';

export default class Script extends ModelWithProps<ScriptType> {
    public taskManager: TaskManager;
    protected methods: Record<ScriptMethodName, undefined | (() => unknown)>;
    protected api: ScriptApi;

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

    init() {
        this.taskManager = new TaskManager(`scripts.script${this.getId()}`);
        this.recompute();
    }

    update(newCode: string) {
        this.executeMethod('stop');
        this.executeMethod('unmount');

        this.setProp('code', newCode);
        this.recompute();

        this.executeMethod('mount');
        this.executeMethod('start');
    }

    recompute() {
        if(this.api) {
            this.api.cleanup();
        }

        const code = `
            (function () {
                ${this.getProp('code')};
                
                return { 
                    mount:   typeof mount === 'function' ? mount : null,
                    unmount: typeof unmount === 'function' ? unmount : null,
                    start:   typeof start === 'function' ? start : null,
                    stop:    typeof stop === 'function' ? stop : null,
                };
            })();
        `;

        this.api = new ScriptApi({
            logger: this.logger,
            taskManager: this.taskManager
        });

        try {
            const result = vm.runInContext(code, vm.createContext(this.api.context()), {
                timeout: 1000
            });

            this.methods = result;
        } catch(err: any) {
            this.logger.error(`Error while recomputing:`, err);
        }
    }

    executeMethod(name: ScriptMethodName) {
        try {
            this.logger.debug(`Executing method '${name}()'...`);
            const method = this.methods[name];

            if(typeof method === 'function') {
                method();
            }
        } catch(err) {
            this.logger.error(`Error executing method '${name}(): '`, err);
        }
    }
}
