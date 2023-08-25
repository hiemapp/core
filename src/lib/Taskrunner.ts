import { EventEmitter } from 'events';
import Database from './Database';
import Logger from './Logger';
import { uuid } from '../utils/string';
import _ from 'lodash';

export interface TaskrunnerTask<TData = any> {
    date: Date | null,
    interval: number | null,
    keyword: string,
    data: TData,
    uuid: string
}

export interface TaskRunnerTaskMeta {
    isBeingPrepared?: boolean
}

export interface TaskrunnerTaskEvent<TData = any> {
    task: TaskrunnerTask<TData>
}

class TaskrunnerClass extends EventEmitter {
    intervalId: NodeJS.Timeout;
    tasks: Record<string, TaskrunnerTask>;
    tasksLatestFetchTime: number;
    logger: Logger;
    taskMeta: Record<string, TaskRunnerTaskMeta | undefined> = {};

    protected CHECK_TASKS_INTERVAL: number = 10 * 1000;
    
    protected REPEATING_TASK_MIN_INTERVAL: number = this.CHECK_TASKS_INTERVAL;

    /**
     * The amount of time an expired task should remain stored in the database/
     */
    protected EXPIRED_TASK_DELETE_AFTER: number = 60 * 1000;

    /** 
     * The difference in time needed for a task to be removed
     * from the database and put into a setTimeout.
     * Note: This should be greater than CHECK_TASKS_INTERVAL.
     */
    protected TASK_PREPARE_MIN_TIME_DIFF: number = 20 * 1000;

    constructor() {
        super();

        this.logger = new Logger({ label: 'Taskrunner' });
    }

    async startTimer() {
        if(this.intervalId) {
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

    async registerDelayedTask<TData = any>(msDelay: number, keyword: string, data?: TData): Promise<string> {
        const date = new Date(Date.now() + msDelay);
        return await this.registerTimedTask(date, keyword, data);
    }

    async registerTimedTask<TData = any>(date: Date, keyword: string, data?: TData): Promise<string> {
        const uuid = await this.createTask<TData>(date, null, keyword, data);
        return uuid;
    }

    async registerRepeatingTask<TData = any>(intervalSeconds: number, keyword: string, data?: TData): Promise<string> {
        // Task interval should be at least this.REPEATING_TASK_MIN_INTERVAL
        if(intervalSeconds < this.REPEATING_TASK_MIN_INTERVAL) {
            this.logger.warn(`Increasing interval of repeating task '${keyword}' to ${this.REPEATING_TASK_MIN_INTERVAL}ms (was ${intervalSeconds}).`)
            intervalSeconds = this.REPEATING_TASK_MIN_INTERVAL;
        }
        
        const uuid = await this.createTask<TData>(null, intervalSeconds, keyword, data);
        return uuid;
    }
    
    getTaskMeta(taskUuid: string) {
        return this.taskMeta[taskUuid];
    }

    updateTaskMeta(taskUuid: string, taskMeta: TaskRunnerTaskMeta) {
        this.taskMeta[taskUuid] = Object.assign(this.taskMeta[taskUuid] ?? {}, taskMeta);
    }

    indexTasks() {
        return {...this.tasks};
    }

    async deleteTask(taskUuid: string): Promise<void> {
        if(!this.findTask(taskUuid)) return;

        this.logger.debug(`Deleting task '${taskUuid}'.`);

        // Delete the task from the database
        Database.query('DELETE FROM `tasks` WHERE `uuid` = ? ', [ taskUuid ]);

        // Delete the task locally
        delete this.tasks[taskUuid];

        // Delete local task meta
        delete this.taskMeta[taskUuid];
    }

    protected async checkTasks() {
        const now = Date.now();

        _.forOwn(this.tasks, task => {
            const meta = this.getTaskMeta(task.uuid);
            if(meta?.isBeingPrepared) return true;

            if(task.date) {
                // If the task's date has already passed, delete and skip over it.
                if(task.date.getTime() + this.EXPIRED_TASK_DELETE_AFTER < now) {
                    this.deleteTask(task.uuid);
                    return true;
                }

                // Run the task if it's time is close to the current time
                if (task.date.getTime() - now <= this.TASK_PREPARE_MIN_TIME_DIFF) {
                    console.log({ d: 0 });
                    this.prepareTaskForExecution(task.uuid);
                }
            } else if(task.interval) {
                if(now % task.interval*1000 > (task.interval*1000 - this.CHECK_TASKS_INTERVAL*1.25)) {
                    this.prepareTaskForExecution(task.uuid);
                }
            }
        })
    }

    protected async createTask<TData = any>(date: Date | null = null, interval: number | null = null, keyword: string, data?: TData): Promise<string> {
        const taskUuid = uuid();
        
        const taskRow: TaskrunnerTask = { 
            date,
            interval, 
            keyword, 
            data, 
            uuid: taskUuid
        };

        this.logger.debug(`Registering new '${keyword}' task`, { meta: { 
            uuid: taskUuid, 
            date,
            interval
        }});

        // Insert the task into the database
        const fields = Database.serializeFields(taskRow);
        await Database.query(`INSERT INTO \`tasks\` SET ${fields}`);

        await this.refetchTasks();

        // The task might have a short time difference,
        // so we should perform a check after creation.
        this.checkTasks();
    
        return taskUuid;
    }

    protected prepareTaskForExecution(taskUuid: string) {
        const task = this.findTask(taskUuid);
        const meta = this.getTaskMeta(taskUuid);

        // Return if the task can not be found
        // or if it's already being prepared.
        if(!task || meta?.isBeingPrepared) return;

        this.logger.debug(`Preparing task '${task.uuid}.'`);
        
        this.updateTaskMeta(task.uuid, { 
            isBeingPrepared: true 
        });

        if(task.date) {
            const msDelay = task.date.getTime() - Date.now();
            
            setTimeout(async () => {
                // Check if the task still exists before executing
                if(!this.findTask(task.uuid)) return;

                this.executeTask(task);
                this.deleteTask(task.uuid);
            }, msDelay);
        } else if(task.interval) {
            const msDelay = task.interval*1000 - (Date.now() % task.interval*1000);

            setTimeout(() => {
                // Check if the task still exists before executing
                if(!this.findTask(task.uuid)) return;

                this.executeTask(task);
                this.updateTaskMeta(task.uuid, { 
                    isBeingPrepared: false
                });
            }, msDelay);
        }
    }

    protected executeTask(task: TaskrunnerTask) {
        this.logger.debug(`Running task '${task.uuid}'.`);

        this.emit('task', { task });
    }

    protected findTask(taskUuid: string) {
        return this.tasks[taskUuid];
    }

    async refetchTasks(): Promise<void> {
        this.logger.debug('Refetching tasks from database.');

        this.tasks = {};
        (await Database.query('SELECT * FROM `tasks`')).forEach(row => {
            this.tasks[row.uuid] = row;
        })

        this.tasksLatestFetchTime = Date.now();
    }
}

const Taskrunner = new TaskrunnerClass();
export default Taskrunner;