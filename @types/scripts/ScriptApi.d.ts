// ---------------------- MODEL ---------------------- \\
export interface ModelType {
    events: Record<string, any>;
}

export interface Model<TModelType extends ModelType> {
    /** Get the id. */
    getId(): number;

    on<TEvent extends Extract<keyof TModelType['events'], string>>(
        event: TEvent, listener: (event: TModelType['events'][TEvent]) => unknown): void;

    off<TEvent extends Extract<keyof TModelType['events'], string>>(
        event: TEvent, listener: (event: TModelType['events'][TEvent]) => unknown): boolean;

}

export type ModelEventListener<TData extends {} = {}> = 
    (event: TData & { cancel: () => void }) => unknown;

// ------------------- TASKMANAGER ------------------- \\
export type TaskManagerListenerCallback = (task: { keyword: string, data: any }) => unknown;

export interface TaskManager {
    addTimedTask<TData = any>(keyword: string, date: Date, data?: TData): Promise<string | false>;
    addRepeatingTask<TData = any>(keyword: string, interval: string, data?: TData): Promise<string | false>;
    addDelayedTask<TData = any>(keyword: string, msDelay: number, data?: TData): Promise<string | false>
    deleteTask(uuid: string): Promise<void>;
    deleteAllTasks(): Promise<void>;
    addHandler(keyword: string, callback: TaskManagerListenerCallback): void;
}

// --------------------- LOGGER --------------------- \\
export interface Logger {
    error(message: any): void;
    warn(message: any): void;
    notice(message: any): void;
    info(message: any): void;
    debug(message: any): void;
}

// ---------------------- USERS ---------------------- \\
export interface UserType extends ModelType {

}

export interface User extends Model<UserType> {
    getName(): string;
    getUsername(): string;
    getSetting(setting: string): any;
    hasPermission(permission: string): boolean;
    
}

// --------------------- DEVICES --------------------- \\
export interface DeviceType extends ModelType {
    events: {
        'driver:input': { 
            input: { name: string, value: any },
            cancel: () => void
        }
    }
}

export interface Device extends Model<DeviceType> {
     /** Get the name. */
    getName(): string;

    /** Get the icon. */
    getIcon(): string;
    
    /** Get the current state. */
    getState(): Promise<{ isActive: boolean, display: any }>;

    /**
     * Perform an input on the device.
     * @param name The name of the input.
     * @param value The value to set the input to.
     */
    performInput(name: string, value: any): Promise<void>;

    /**
     * Read data from the sensor.
     */
    getSensorData(): Promise<any>;
}

export interface ScriptApiContext {
    system: {
        tasks: TaskManager,
    },
    logger: Logger,
    devices: {
        getDeviceById(id: number): Device | null,
        getDeviceByName(name: string): Device | null
    }
}

export declare const devices: ScriptApiContext['devices'];
export declare const logger: ScriptApiContext['logger'];
export declare const system: ScriptApiContext['system'];
