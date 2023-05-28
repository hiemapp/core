import { EventEmitter } from 'events';
import Database from './Database';
import Logger from './Logger';
import { uuid } from '../utils/string';

export interface TaskrunnerTask<TData = any> {
    date: Date,
    keyword: string,
    data: TData,
    uuid: string,
    status: 'WAITING' | 'PREPARING'
}

export interface TaskrunnerTaskEvent<TData = any> {
    task: TaskrunnerTask<TData>
}

class TaskrunnerClass extends EventEmitter {
    intervalId: NodeJS.Timer;
    tasks: TaskrunnerTask[] = [];
    tasksLatestFetchTime: number;
    logger: Logger;

    protected REFETCH_TASKS_INTERVAL: number = 60 * 1000;
    protected CHECK_TASKS_INTERVAL: number = 10 * 1000;

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

    startTimer() {
        if(this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Set an interval for checking the tasks
        this.intervalId = setInterval(() => {
            this.checkTasks();
        }, this.CHECK_TASKS_INTERVAL);

        // Check tasks immediately
        this.checkTasks();

        this.logger.debug(`Timer started, checking tasks every ${this.CHECK_TASKS_INTERVAL}ms.`);
        this.logger.debug(`Refetching tasks from database every ${this.REFETCH_TASKS_INTERVAL}ms.`)
    }

    async registerDelayedTask<TData = any>(msDelay: number, keyword: string, data?: TData): Promise<string> {
        const date = new Date(Date.now() + msDelay);
        return await this.registerTimedTask(date, keyword, data);
    }

    async registerTimedTask<TData = any>(date: Date, keyword: string, data?: TData): Promise<string> {
        const uuid = await this.createTask<TData>(date, keyword, data);
        return uuid;
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

        await this.refetchTasks();
    }

    protected async setTaskStatus(uuid: string, status: TaskrunnerTask['status']) {
        await Database.query('UPDATE `tasks` set `status` = ? WHERE `uuid` = ?', [ status, uuid ]);

        await this.refetchTasks();
    }

    protected async checkTasks() {
        const now = Date.now();
        const doRefetchTasks = !this.tasksLatestFetchTime || (now - this.tasksLatestFetchTime >= this.REFETCH_TASKS_INTERVAL);

        if(doRefetchTasks) {
            await this.refetchTasks();
        }

        this.tasks.forEach(task => {
            // If the task's time has already passed, delete and skip over it.
            if(task.date.getTime() + this.EXPIRED_TASK_DELETE_AFTER < now) {
                this.deleteTask(task.uuid);
                return true;
            }

            // Run the task if it's time is close to the current time
            if (task.date.getTime() - now <= this.TASK_PREPARE_MIN_TIME_DIFF) {
                this.prepareTaskForExecution(task.uuid);
            }
        })
    }

    protected async createTask<TData = any>(date: Date, keyword: string, data?: TData) {
        const taskUuid = uuid();
        const taskRow: TaskrunnerTask = { date, keyword, data, uuid: taskUuid, status: 'WAITING' };

        this.logger.debug(`Registering new '${keyword}' task`, { meta: { uuid: taskUuid, date: date.toISOString() }});

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
        if(!task || task.status !== 'WAITING') return;

        // The delay should always be at least 10ms
        const msDelay = Math.max(task.date.getTime() - Date.now(), 10);
        this.logger.debug(`Preparing task ${taskUuid}`);

        // Change the task's status
        this.setTaskStatus(task.uuid, 'PREPARING');

        // Create a timeout for executing the task
        setTimeout(async () => {
            // If the task does not exist anymore, don't run it
            if(!this.findTask(task.uuid)) {
                return;
            }

            this.executeTask(task);

            // Delete the task after execution
            this.deleteTask(task.uuid);
        }, msDelay);
    }

    protected executeTask(task: TaskrunnerTask) {
        this.logger.debug(`Running task '${task.uuid}'...`, { meta: { task }});

        this.emit('task', { task });
    }

    protected findTask(taskUuid: string) {
        return this.tasks.find(t => t.uuid === taskUuid);
    }

    async refetchTasks(): Promise<void> {
        this.tasks = await Database.query('SELECT * FROM `tasks`');
        this.tasksLatestFetchTime = Date.now();
    }
}

const Taskrunner = new TaskrunnerClass();
export default Taskrunner;