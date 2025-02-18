import ModelWithProps from '../lib/ModelWithProps';
import _ from 'lodash';
import { ScriptType } from './Script.types';
import ScriptController from './ScriptController';
import TaskManager from '~/lib/TaskManager';
import vm from 'vm';
import ScriptApi from './ScriptApi';
import ScriptEventListenerManager from './ScriptEventListenerManager';
import { Notification } from '~/notifications';
import { User, UserController } from '~/users';
import { z } from 'zod';

export default class Script extends ModelWithProps<ScriptType> {
    protected $schema = z.object({
        name: z.string().nullable(),
        icon: z.string().nullable(),
        code: z.string().default(''),
        userId: z.number()
    })

    taskManager: TaskManager;
    eventListeners: ScriptEventListenerManager;

    protected _context: vm.Context;

    async __init() {
        this.taskManager = new TaskManager(`scripts.${this.id}`);
        this.eventListeners = new ScriptEventListenerManager();
        this._context = vm.createContext(this._getContext());
    }

    getUser() {
        try {
            return UserController.find(this.getProp('userId'));
        } catch(err) {
            return null;
        }
    }

    async unload() {
        // Delete all tasks from this script
        await this.taskManager.deleteAllTasks();
        this.eventListeners.removeAll();
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
                async function main() {
                    ${code}
                }
                
                // Error-handling
                main().catch(err => $script.handleError(err));
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
    
    async updateCode(code: string, user: User) {
        this.setProp('code', code);
        this.setProp('userId', user.id);
        await this.reload();
    }

    async handleError(err: any) {
        this.logger.error(err);

        const user = this.getUser();
        if(!user) return;

        const notification = new Notification('@hiem/core.scripts.executionError.title', 'error');
        notification.addRecipients(user);
        notification.setBody(`<pre>${err.stack ?? err}</pre>`, true);
        notification.send();
    }
}
