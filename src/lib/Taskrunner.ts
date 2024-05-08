import Database from './Database';
import Logger from './Logger';
import { uuid } from '../utils/string';
import _ from 'lodash';
import cronParser from 'cron-parser';
import TaskManager from './TaskManager';

export interface Task<TData = any> {
    date: Date | null,
    interval: string | null,
    keyword: string,
    data: TData,
    uuid: string,
    meta: {
        manager: {
            id: string
        }
    }
}

export interface TaskState {
    isBeingPrepared?: boolean
}

class Taskrunner {
    public static tasksLatestFetchTime: number;
    public static managers: Record<string, TaskManager> = {};

    protected static intervalId: NodeJS.Timeout;
    protected static tasks: Record<string, Task>;
    protected static taskState: Record<string, TaskState | undefined> = {};
    protected static logger = new Logger({ label: 'Taskrunner' });

    protected static CHECK_TASKS_INTERVAL: number = 10 * 1000;

    protected static REPEATING_TASK_MIN_INTERVAL: number = this.CHECK_TASKS_INTERVAL;

    /**
     * The amount of time an expired task should remain stored in the database/
     */
    protected static EXPIRED_TASK_DELETE_AFTER: number = 60 * 1000;

    /** 
     * The difference in time needed for a task to be removed
     * from the database and put into a setTimeout.
     * Note: This should be greater than CHECK_TASKS_INTERVAL.
     */
    protected static TASK_PREPARE_MIN_TIME_DIFF: number = 20 * 1000;

    static async addTask<TData = any>(manager: TaskManager, keyword: string, date: Date | null = null, interval: string | null = null, data?: TData): Promise<string | false> {
        const taskUuid = uuid();

        try {
            // Check if the interval is valid
            if(interval) {
                try {
                    cronParser.parseExpression(interval);
                } catch(err: any) {
                    throw new Error(`Invalid interval: ${err.message}.`);
                }
            }

            const taskRow: Task = {
                date,
                interval,
                keyword,
                data,
                uuid: taskUuid,
                meta: {
                    ...manager.options.meta,
                    manager: {
                        id: manager.id
                    }
                }
            };

            this.logger.debug(`Adding new '${keyword}' task`, { uuid: taskUuid, date, interval });

            // Insert the task into the database
            const fields = Database.serializeFields(taskRow);
            await Database.query(`INSERT INTO \`tasks\` SET ${fields}`);

            await this.refetchTasks();

            // The task might have a short time difference,
            // so we should perform a check after creation.
            this.checkTasks();

            return taskUuid;
        } catch(err: any) {
            this.logger.error(`Error adding task '${taskUuid}':`, err);
        }

        return false;
    }

    static async startInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Set an interval for checking the tasks
        this.intervalId = setInterval(() => {
            this.checkTasks();
        }, this.CHECK_TASKS_INTERVAL);

        this.logger.debug(`Timer started, checking tasks every ${this.CHECK_TASKS_INTERVAL}ms.`);

        // Check tasks immediately
        await this.refetchTasks();
        this.checkTasks();
    }

    protected static getTaskState(taskUuid: string) {
        return this.taskState[taskUuid];
    }

    protected static updateTaskState(taskUuid: string, taskState: TaskState) {
        this.taskState[taskUuid] = Object.assign(this.taskState[taskUuid] ?? {}, taskState);
    }

    static index() {
        return Object.values(this.tasks);
    }

    static async deleteTask(uuid: string): Promise<void> {
        if (!this.findTask(uuid)) return;

        this.logger.debug(`Deleting task '${uuid}'.`);

        // Delete the task from the database
        Database.query('DELETE FROM `tasks` WHERE `uuid` = ? ', [uuid]);

        // Delete the task locally
        delete this.tasks[uuid];

        // Delete local task meta
        delete this.taskState[uuid];
    }

    protected static async checkTasks() {
        const now = Date.now();

        _.forOwn(this.tasks, task => {
            const state = this.getTaskState(task.uuid);
            if (state?.isBeingPrepared) return true;

            if (task.date) {
                // If the task's date has already passed, delete and skip over it.
                if (task.date.getTime() + this.EXPIRED_TASK_DELETE_AFTER < now) {
                    this.deleteTask(task.uuid);
                    return true;
                }

                // Run the task if it's time is close to the current time
                if (task.date.getTime() - now <= this.TASK_PREPARE_MIN_TIME_DIFF) {
                    this.prepareTaskForExecution(task.uuid);
                }
            } else if (task.interval) {
                try {
                    const nextDate = cronParser.parseExpression(task.interval).next();

                    if(nextDate.getTime() - now <= this.CHECK_TASKS_INTERVAL * 1.25) {
                        this.prepareTaskForExecution(task.uuid);
                    }
                } catch(err: any) {
                    this.logger.error(`Error checking task '${task.uuid}':`, err);
                }
            }
        })
    }

    protected static prepareTaskForExecution(taskUuid: string) {
        const task = this.findTask(taskUuid);
        const meta = this.getTaskState(taskUuid);

        // Return if the task can not be found
        // or if it's already being prepared.
        if (!task || meta?.isBeingPrepared) return;

        this.logger.debug(`Preparing task '${task.uuid}.'`);

        this.updateTaskState(task.uuid, {
            isBeingPrepared: true
        });

        if (task.date) {
            const msDelay = task.date.getTime() - Date.now();

            setTimeout(async () => {
                // Check if the task still exists before executing
                if (!this.findTask(task.uuid)) return;

                this.executeTask(task);
                this.deleteTask(task.uuid);
            }, msDelay);
        } else if (task.interval) {
            try {
                const nextDate = cronParser.parseExpression(task.interval).next();
                const msDelay = nextDate.getTime() - Date.now();

                setTimeout(() => {
                    // Check if the task still exists before executing
                    if (!this.findTask(task.uuid)) return;

                    this.executeTask(task);
                    this.updateTaskState(task.uuid, {
                        isBeingPrepared: false
                    });
                }, msDelay);
            } catch(err: any) {
                this.logger.error(`Error preparing task '${task.uuid}':`, err);
            }
        }
    }

    protected static executeTask(task: Task) {
        this.logger.debug(`Executing task '${task.uuid}'.`);

        try {
            const manager = this.managers[task.meta.manager.id];
            
            if(!manager) {
                throw new Error(`TaskManager '${task.meta.manager.id}' not found.`);
            }

            manager.handlers.forEach(handler => {
                if(handler.keyword === task.keyword) {
                    handler.callback(task);
                }
            })
        } catch (err: any) {
            this.logger.error(`Error executing task '${task.uuid}':`, err);
        }
    }

    protected static findTask(taskUuid: string) {
        return this.tasks[taskUuid];
    }

    static async refetchTasks(): Promise<void> {
        this.logger.debug('Refetching tasks from database.');

        this.tasks = {};
        (await Database.query('SELECT * FROM `tasks`')).forEach(row => {
            this.tasks[row.uuid] = row;
        })

        this.tasksLatestFetchTime = Date.now();
    }
}

export default Taskrunner;