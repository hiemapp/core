import Logger from './Logger';
import _ from 'lodash';
import cronParser from 'cron-parser';
import TaskManager from './TaskManager';
import TaskController from '~/tasks/TaskController';
import Task from '~/tasks/Task';

export interface TaskState {
    isPreparing: boolean
}

class Taskrunner {
    public static tasksLatestFetchTime: number;
    public static managers: Record<string, TaskManager> = {};

    protected static intervalId: NodeJS.Timeout;
    protected static taskState: Record<string, TaskState | undefined> = {};
    protected static logger = new Logger({ label: 'Taskrunner' });

    /**
     * The interval at which tasks should be checked.
     */
    protected static CHECK_TASKS_INTERVAL: number = 10 * 1000;

    /** 
     * The difference in time required for a task to be removed
     * from the database and put into a setTimeout().
     * Note: This should be greater than CHECK_TASKS_INTERVAL.
     */
    protected static TASK_PREPARE_BEFORE_MS: number = 20 * 1000;

    /**
    * A task is considered expired when its execution date is longer ago
    * than this threshold, meaning it will not be executed anymore.
     */
    protected static TASK_EXPIRE_AFTER_MS: number = 60 * 1000;

    static async addTask<TData = any>(manager: TaskManager, keyword: string, date: Date | null = null, interval: string | null = null, data?: TData): Promise<Task|false> {
        try {
            // Check if the interval is valid
            if (interval) {
                try {
                    cronParser.parseExpression(interval);
                } catch (err: any) {
                    throw new Error(`Invalid interval (${interval}): ${err.message}.`);
                }
            }

            const task = await TaskController.create({
                date,
                interval,
                keyword,
                data: data ?? {},
                meta: {
                    managerId: manager.id
                }
            })

            this.logger.debug(`Created new '${task.getKeyword()}' task`, { id: task.id, date: task.getDate(), interval: task.getInterval() });
            
            // The task might have a short time difference, check tasks immediately after creation.
            this.checkTasks();

            return task;
        } catch (err: any) {
            throw new Error(`Error adding task: ${err.message}.`);
        }
    }

    static async start() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Set an interval for checking the tasks
        this.intervalId = setInterval(() => {
            this.checkTasks();
        }, this.CHECK_TASKS_INTERVAL);

        this.logger.debug(`Timer started, checking tasks every ${this.CHECK_TASKS_INTERVAL}ms.`);

        // Check tasks immediately
        this.checkTasks();
    }

    protected static getTimeUntil(date: Date) {
        return date.getTime() - Date.now();
    }

    protected static getTaskState(id: string): TaskState | undefined {
        return this.taskState[id];
    }

    protected static updateTaskState(id: string, taskState: TaskState|null) {
        if(taskState === null) {
            delete this.taskState[id];
            return;
        }
        
        this.taskState[id] = Object.assign(this.taskState[id] ?? {}, taskState);
    }

    protected static async checkTasks() {
        TaskController.index().forEach(task => {
            const state = this.getTaskState(task.id);
            if (state?.isPreparing) return;
            
            const date = Taskrunner.getExecutionDate(task);
            if(!date) return;

            if(this.isExpiredDate(date)) {
                TaskController.delete(task.id)
                return;
            }

            if (this.getTimeUntil(date) < this.TASK_PREPARE_BEFORE_MS) {
                this.prepareTask(task, date);
            }
        })
    }

    /**
     * Get the (next) execution date of a task.
     * @param task The task of which to get the execution date.
     * @returns The execution date.
     */
    protected static getExecutionDate(task: Task) {
        const date = task.getDate();
        if(date) return date;

        const interval = task.getInterval();
        if (interval) {
            try {
                return new Date(cronParser.parseExpression(interval).next().getTime());
            } catch (err: any) {
                this.logger.error(`Error preparing task ${task}:`, err);
            }
        }

        return null;
    }

    /**
     * Check if a given date has expired according to `TASK_EXPIRE_AFTER_MS`.
     * @param date The date to check.
     * @returns Whether the date has expired.
     */
    protected static isExpiredDate(date: Date) {
        return this.getTimeUntil(date) <= this.TASK_EXPIRE_AFTER_MS*-1;
    }

    protected static prepareTask(task: Task, date: Date) {
        const state = this.getTaskState(task.id);
        if (state?.isPreparing) return;

        this.updateTaskState(task.id, { isPreparing: true });

        this.logger.debug(`Preparing task ${task}...`);
        
        setTimeout(async () => {
            // Check if the task still exists before executing
            if (!TaskController.exists(task.id)) return;

            this.executeTask(task);

            // Delete non-repeating task after execution
            if(!task.getInterval()) {
                TaskController.delete(task.id);
            }
        }, Taskrunner.getTimeUntil(date));
    }

    protected static executeTask(task: Task) {
        this.logger.debug(`Executing task ${task}...`);

        try {
            const manager = this.managers[task.getMeta().managerId];

            if (!manager) {
                throw new Error(`TaskManager '${task.getMeta().managerId}' not found.`);
            }

            manager.handlers.forEach(handler => {
                if (handler.keyword === task.getKeyword()) {
                    handler.callback(task);
                }
            })

            this.updateTaskState(task.id, null);
        } catch (err: any) {
            this.logger.error(`Error executing task ${task}:`, err);
        }
    }
}

export default Taskrunner;