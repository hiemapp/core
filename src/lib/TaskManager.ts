import Taskrunner, { type Task } from './Taskrunner';

export interface TaskManagerListener<TData = any> {
    keyword: string,
    callback: (task: Task<TData>) => unknown
}

export default class TaskManager {
    public readonly id;
    public readonly handlers: TaskManagerListener[] = []; 

    constructor(id: string) {
        this.id = id;

        if(Taskrunner.managers[id]) {
            throw new Error(`TaskManager '${id}' already exists.`);
        }

        Taskrunner.managers[id] = this;
    }

    addHandler(keyword: string, callback: TaskManagerListener['callback']) {
        this.handlers.push({ keyword, callback });
    }

    async addDelayedTask<TData = any>( keyword: string, msDelay: number, data?: TData) {
        const date = new Date(Date.now() + msDelay);
        return await Taskrunner.addTask<TData>(this, keyword, date, null, data);
    }

    async addTimedTask<TData = any>( keyword: string, date: Date, data?: TData) {
        return await Taskrunner.addTask<TData>(this, keyword, date, null, data);
    }

    /**
     * Register a repeating task.
     * @param interval The cronjob pattern.
     * @param keyword The task keyword.
     * @param data The task data.
     * @returns The task uuid.
     */
    async addRepeatingTask<TData = any>(keyword: string, interval: string, data?: TData) {
        return await Taskrunner.addTask<TData>(this, keyword, null, interval, data);
    }

    async deleteTask(uuid: string) {
        return Taskrunner.deleteTask(uuid);
    }

    async deleteAllTasks() {
        await Promise.all(Taskrunner.listTasks().map(task => {
            if(task.meta.managerId === this.id) {
                return Taskrunner.deleteTask(task.uuid);
            }
        }));
    }
}