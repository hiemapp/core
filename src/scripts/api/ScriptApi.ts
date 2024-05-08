import type { ScriptApiContext } from '~types/scripts/ScriptApi';
import type Logger from '~/lib/Logger';
import TaskManager from '~/lib/TaskManager';
import EventManager from './utils/EventManager';
import DeviceController from '~/devices/DeviceController';
import Model from '~/lib/Model';
import DeviceWrapper from './wrappers/DeviceWrapper';

export interface ScriptApiOptions {
    taskManager: TaskManager;
    logger: Logger;
}

const WRAPPERS: Record<string, any> = {
    'Device': DeviceWrapper
}

export default class ScriptApi {
    public eventManager;

    protected options;
    protected wrappedModels: Record<string, InstanceType<typeof WRAPPERS[keyof typeof WRAPPERS]>> = {};

    constructor(options: ScriptApiOptions) {
        this.options = options;
        this.eventManager = new EventManager();
    }

    protected wrap(model: Model<any> | undefined): typeof WRAPPERS[keyof typeof WRAPPERS] | null {
        if(typeof model?.getId !== 'function'|| typeof model?.constructor?.name !== 'string') {
            return null;
        }

        const name = model.constructor.name;
        const instanceId = `${name}${model.getId()}`;

        if(!WRAPPERS[name]) {
            throw new Error(`No wrapper defined for '${name}'.`);
        }

        if(!this.wrappedModels[instanceId]) {
            this.wrappedModels[instanceId] = new WRAPPERS[name](model, this);
        }

        return this.wrappedModels[instanceId];
    }

    cleanup() {
        this.eventManager.removeAll();
    }
    
    context(): ScriptApiContext {
        return {
            logger: this.options.logger,
            system: {
                tasks: this.options.taskManager
            },
            devices: {
                getDeviceById: (id: number) => {
                    return this.wrap(DeviceController.find(id));
                },

                getDeviceByName: (name: string) => {
                    return this.wrap(DeviceController.findBy(d => d.getProp('name').toLowerCase().trim().replaceAll(' ', '') === name.toLowerCase().trim().replaceAll(' ', '')));
                }
            }
        }
    }

}