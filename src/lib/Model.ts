import * as _ from 'lodash';
import { EventEmitter } from 'events';
import Logger, { logger } from './Logger';

export interface ModelConfig {
    maxListeners?: number;
}

abstract class Model<TId extends string | number> extends EventEmitter {
    protected __modelId: TId;
    protected __modelConfig(): ModelConfig { return {}; };

    logger: Logger;

    constructor(id: TId) {
        super();

        this.__modelId = id;
        this.logger = logger.child({ label: this.toString() });

        const config = this.__modelConfig();
        if (config) {
            if (typeof config.maxListeners === 'number') {
                this.setMaxListeners(config.maxListeners);
            }
        }
    }

    /**
     * Convert the model to a string.
     */
    toString(): string {
        const type = this.constructor.name;
        const id = this.getId();

        return id ? `[${type} ${id}]` : `[${type}]`;
    }

    /**
     * Convert the model to JSON.
     */
    toJSON(): any {
        return { id: this.getId() };
    }

    getId() {
        return this.__modelId;
    }
}

export default Model;
