import { TaskManagerListener } from '~/lib/TaskManager.js';
import { Task_SA } from '../lib/Task.script-api.js';

export function RepeatingTask_SA() {
    return class RepeatingTask<TData = any> extends Task_SA<TData> {
        readonly interval;

        constructor(interval: string, data?: TData, handler?: TaskManagerListener['callback']) {
            super(data, handler);
            this.interval = interval;

            this.$script.taskManager.addRepeatingTask('script_task', this.interval, this.data);
        }
    }
}