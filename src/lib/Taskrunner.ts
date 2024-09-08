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
        managerId: string;
    }
}

export interface TaskState {
    isPreparing: boolean
}

class Taskrunner {
    public static tasksLatestFetchTime: number;
    public static managers: Record<string, TaskManager> = {};

    protected static intervalId: NodeJS.Timeout;
    protected static tasks: Record<string, Task> = {};
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

    static async addTask<TData = any>(manager: TaskManager, keyword: string, date: Date | null = null, interval: string | null = null, data?: TData): Promise<string> {
        const taskUuid = uuid();

        try {
            // Check if the interval is valid
            if (interval) {
                try {
                    cronParser.parseExpression(interval);
                } catch (err: any) {
                    throw new Error(`Invalid interval (${interval}): ${err.message}.`);
                }
            }

            const task: Task = {
                date,
                interval,
                keyword,
                data,
                uuid: taskUuid,
                meta: {
                    managerId: manager.id
                }
            };

            // Register the task
            this.registerTask(task);

            // The task might have a short time difference,
            // so we should perform a check after creation.
            this.checkTasks();

            return taskUuid;
        } catch (err: any) {
            throw new Error(`Error adding task '${taskUuid}': ${err.message}.`);
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
        await this.fetchTasks();
        this.checkTasks();
    }

    static listTasks() {
        return Object.values(this.tasks);
    }

    protected static getTimeUntil(date: Date) {
        return date.getTime() - Date.now();
    }

    protected static getTaskState(taskUuid: string): TaskState | undefined {
        return this.taskState[taskUuid];
    }

    protected static updateTaskState(taskUuid: string, taskState: TaskState) {
        this.taskState[taskUuid] = Object.assign(this.taskState[taskUuid] ?? {}, taskState);
    }

    static async deleteTask(uuid: string): Promise<void> {
        // Delete task from local memory
        delete this.tasks[uuid];
        delete this.taskState[uuid];

        // Delete task from database
        await Database.query('DELETE FROM `tasks` WHERE `uuid` = ? ', [uuid]);

        // this.logger.debug(`Deleted task '${uuid}'.`);
    }

    protected static async registerTask(task: Task): Promise<boolean> {
        try {
            // Don't register task if its date is in the past
            if (task.date && Taskrunner.getTimeUntil(task.date) < 0) {
                return false;
            }

            // Add task to local memory
            this.tasks[task.uuid] = task;
            this.taskState[task.uuid] = { isPreparing: false };

            // Add task to database
            this.storeTaskInDatabase(task);

            this.logger.debug(`Registered new '${task.keyword}' task`, { uuid: task.uuid, date: task.date, interval: task.interval });
            return true;
        } catch (err) {
            this.logger.error(`Error registering task '${task.uuid}':`, err);
            return false;
        }
    }

    protected static async storeTaskInDatabase(task: Task) {
        // Don't add timed tasks with a short lifespan to the database
        if(task.date && this.getTimeUntil(task.date) < this.TASK_MIN_LIFESPAN_FOR_DATABASE) return false;
        
        const fields = Database.serializeFields(task);
        await Database.query(`INSERT INTO \`tasks\` SET ${fields}`);
        return true;
    }

    protected static async checkTasks() {
        const now = Date.now();

        _.forOwn(this.tasks, task => {
            const state = this.getTaskState(task.uuid);
            if (state?.isPreparing) return true;

            if (task.date) {
                // If the task's date has already passed, delete the the task and ignore it
                if (Taskrunner.getTimeUntil(task.date) < 0) {
                    this.deleteTask(task.uuid);
                    return true;
                }

                // Run the task if it's time is close to the current time
                if (Taskrunner.getTimeUntil(task.date) < this.TASK_PREPARE_MS_BEFORE) {
                    this.prepareTaskForExecution(task.uuid);
                }
            } else if (task.interval) {
                try {
                    const nextDate = cronParser.parseExpression(task.interval).next();

                    if (nextDate.getTime() - now <= this.TASK_PREPARE_MS_BEFORE) {
                        this.prepareTaskForExecution(task.uuid);
                    }
                } catch (err: any) {
                    this.logger.error(`Error checking task '${task.uuid}':`, err);
                }
            }
        })
    }

    protected static prepareTaskForExecution(taskUuid: string) {
        const task = this.getTask(taskUuid);
        const state = this.getTaskState(taskUuid);

        // Return if the task can not be found
        // or if it's already being prepared.
        if (!task || state?.isPreparing) return;

        // this.logger.debug(`Preparing task '${task.uuid}.'`);

        this.updateTaskState(task.uuid, {
            isPreparing: true
        });

        let msDelay: number|null = null;
        if (task.date) {
            msDelay = task.date.getTime() - Date.now();
        } else if (task.interval) {
            try {
                const nextDate = cronParser.parseExpression(task.interval).next();
                msDelay = nextDate.getTime() - Date.now();
            } catch (err: any) {
                this.logger.error(`Error preparing task '${task.uuid}':`, err);
            }
        }

        if(typeof msDelay === 'number') {
            setTimeout(async () => {
                // Check if the task still exists before executing
                if (!this.getTask(task.uuid)) return;

                this.executeTask(task);

                // Delete non-repeating task after execution
                if(!task.interval) {
                    this.deleteTask(task.uuid);
                }
            }, msDelay);
        }
    }

    protected static executeTask(task: Task) {
        this.logger.debug(`Executing task '${task.uuid}'.`);

        try {
            const manager = this.managers[task.meta.managerId];

            if (!manager) {
                throw new Error(`TaskManager '${task.meta.managerId}' not found.`);
            }

            manager.handlers.forEach(handler => {
                if (handler.keyword === task.keyword) {
                    handler.callback(task);
                }
            })

            this.updateTaskState(task.uuid, {
                isPreparing: false
            });
        } catch (err: any) {
            this.logger.error(`Error executing task '${task.uuid}':`, err);
        }
    }

    protected static getTask(taskUuid: string) {
        return this.tasks[taskUuid];
    }

    static async fetchTasks(): Promise<void> {
        this.logger.debug('Fetching tasks from database.');

        const rows = await Database.query('SELECT * FROM `tasks`');
        rows.forEach(row => {
            this.tasks[row.uuid] = row;
        })
    }
}

export default Taskrunner;