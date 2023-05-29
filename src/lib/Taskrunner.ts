import { EventEmitter } from 'events';
import Database from './Database';
import Logger from './Logger';
import { uuid } from '../utils/string';

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
    intervalId: NodeJS.Timer;
    tasks: TaskrunnerTask[] = [];
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

        this.logger = new Logger({ label: 'TaskRunner' });
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
        const uuid = await this.createTask<TData>(date, keyword, data);
        return uuid;
    }

    async registerRepeatingTask<TData = any>(intervalMs: number, keyword: string, data?: TData): Promise<string> {
        // Task interval should be at least this.REPEATING_TASK_MIN_INTERVAL
        if(intervalMs < this.REPEATING_TASK_MIN_INTERVAL) {
            this.logger.warn(`Increasing interval of repeating task '${keyword}' to ${this.REPEATING_TASK_MIN_INTERVAL}ms (was ${intervalMs}).`)
            intervalMs = this.REPEATING_TASK_MIN_INTERVAL;
        }
        
        const uuid = await this.createTask<TData>(intervalMs, keyword, data);
        return uuid;
    }
    
    getTaskMeta(taskUuid: string) {
        return this.taskMeta[taskUuid];
    }

    updateTaskMeta(taskUuid: string, taskMeta: TaskRunnerTaskMeta) {
        this.taskMeta[taskUuid] = Object.assign(this.taskMeta[taskUuid] ?? {}, taskMeta);
    }

    findAll(keyword: string) {
        return this.tasks.filter(t => t.keyword === keyword);
    }

    indexTasks() {
        return [...this.tasks];
    }

    async deleteTask(taskUuid: string): Promise<void> {
        // Delete the task from the database
        Database.query('DELETE FROM `tasks` WHERE `uuid` = ? ', [ taskUuid ]);

        // Delete local task meta
        delete this.taskMeta[taskUuid];

        // Delete the task locally
        this.tasks = this.tasks.filter(t => t.uuid !== taskUuid);
    }

    protected async checkTasks() {
        const now = Date.now();

        this.tasks.forEach(task => {
            const meta = this.getTaskMeta(task.uuid);
            if(meta?.isBeingPrepared) return true;

            if(task.date) {
                // If the task's time has already passed, delete and skip over it.
                if(task.date.getTime() + this.EXPIRED_TASK_DELETE_AFTER < now) {
                    this.deleteTask(task.uuid);
                    return true;
                }

                // Run the task if it's time is close to the current time
                if (task.date.getTime() - now <= this.TASK_PREPARE_MIN_TIME_DIFF) {
                    this.prepareTaskForExecution(task.uuid);
                }
            } else if(task.interval) {
                if(now % task.interval > (task.interval - this.CHECK_TASKS_INTERVAL*1.25)) {
                    this.prepareTaskForExecution(task.uuid);
                }
            }
        })
    }

    protected async createTask<TData = any>(date: Date, keyword: string, data?: TData): Promise<string>;
    protected async createTask<TData = any>(intervalMs: number, keyword: string, data?: TData): Promise<string>
    protected async createTask<TData = any>(dateOrInterval: Date | number, keyword: string, data?: TData): Promise<string> {
        const taskUuid = uuid();
        const date = (dateOrInterval instanceof Date ? dateOrInterval : null);
        const interval = (dateOrInterval instanceof Date ? null : dateOrInterval);

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
            const msDelay = task.interval - (Date.now() % task.interval);

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
        return this.tasks.find(t => t.uuid === taskUuid);
    }

    async refetchTasks(): Promise<void> {
        this.logger.debug('Refetching tasks from database.');

        this.tasks = await Database.query('SELECT * FROM `tasks`');
        this.tasksLatestFetchTime = Date.now();
    }
}

const Taskrunner = new TaskrunnerClass();
export default Taskrunner;