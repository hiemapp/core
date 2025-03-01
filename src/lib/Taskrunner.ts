import Database from './Database';
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
     * The difference in time required for a task to be added to
     * the database.
     */
    protected static TASK_MIN_LIFESPAN_FOR_DATABASE: number = 20 * 1000;

    /** 
     * The difference in time required for a task to be removed
     * from the database and put into a setTimeout().
     * Note: This should be greater than CHECK_TASKS_INTERVAL.
     */
    protected static TASK_PREPARE_MS_BEFORE: number = 20 * 1000;

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

            // Ignore if dat is in the past
            if(date && Taskrunner.getTimeUntil(date) <= 0) return false;

            const task = await TaskController.create({
                date,
                interval,
                keyword,
                data,
                meta: {
                    managerId: manager.id
                }
            })

            // Set default task state
            this.taskState[task.id] = { isPreparing: false };

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

    protected static updateTaskState(id: string, taskState: TaskState) {
        this.taskState[id] = Object.assign(this.taskState[id] ?? {}, taskState);
    }

    protected static async checkTasks() {
        const now = Date.now();

        TaskController.index().forEach(task => {
            const state = this.getTaskState(task.id);
            if (state?.isPreparing) return true;
            
            const date = task.getDate();
            const interval = task.getInterval();
            if (date) {
                // If the task's date has already passed, delete the the task and ignore it
                if (Taskrunner.getTimeUntil(date) < 0) {
                    TaskController.delete(task.id);
                    return true;
                }

                // Run the task if it's time is close to the current time
                if (Taskrunner.getTimeUntil(date) < this.TASK_PREPARE_MS_BEFORE) {
                    this.prepareTaskForExecution(task.id);
                }
            } else if (interval) {
                try {
                    const nextDate = cronParser.parseExpression(interval).next();

                    if (nextDate.getTime() - now <= this.TASK_PREPARE_MS_BEFORE) {
                        this.prepareTaskForExecution(task.id);
                    }
                } catch (err: any) {
                    this.logger.error(`Error checking task '${task.id}':`, err);
                }
            }
        })
    }

    protected static prepareTaskForExecution(task: Task) {
        const state = this.getTaskState(task.id);

        // Return if the task can not be found
        // or if it's already being prepared.
        if (!state?.isPreparing) return;

        this.logger.debug(`Preparing task '${task.id}.'`);

        this.updateTaskState(task.id, {
            isPreparing: true
        });

        let msDelay: number|null = null;
        const date = task.getDate();
        const interval = task.getInterval();
        if (date) {
            msDelay = date.getTime() - Date.now();
        } else if (interval) {
            try {
                const nextDate = cronParser.parseExpression(interval).next();
                msDelay = nextDate.getTime() - Date.now();
            } catch (err: any) {
                this.logger.error(`Error preparing task '${task.id}':`, err);
            }
        }

        if(typeof msDelay === 'number') {
            setTimeout(async () => {
                // Check if the task still exists before executing
                if (!TaskController.exists(task.id)) return;

                this.executeTask(task);

                // Delete non-repeating task after execution
                if(!task.getInterval()) {
                    TaskController.delete(task.id);
                }
            }, msDelay);
        }
    }

    protected static executeTask(task: Task) {
        this.logger.debug(`Executing task '${task.id}'.`);

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

            this.updateTaskState(task.id, {
                isPreparing: false
            });
        } catch (err: any) {
            this.logger.error(`Error executing task '${task.id}':`, err);
        }
    }
}

export default Taskrunner;