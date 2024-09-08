import ScriptContext from '~/scripts/ScriptContext';
import { v4 as uuidv4 } from 'uuid';
import { ApiModule_SA } from './ApiStaticModule.script-api';
import { TaskManagerListener } from '~/lib/TaskManager';

abstract class Task<TData = any> extends ApiModule_SA {
    _id: string;

    readonly data: TData;

    constructor(data?: TData, handler?: TaskManagerListener['callback']) {
        super();

        this._id = uuidv4();

        if(data) this.data = data;
        if(handler) this.addHandler(handler);
    }

    dispose() {
        ScriptContext.getScript().taskManager.deleteTask(this._id);
    }

    addHandler(handler: TaskManagerListener<TData>['callback']) {
        this.$script.taskManager.addHandler('script_task', handler)
    }
}

export { Task as Task_SA }