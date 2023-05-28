import * as _ from 'lodash';
import { EventEmitter } from 'events';
import Logger, { logger } from './Logger';

export interface ModelConfig {
    maxListeners?: number;
}

abstract class Model<TId extends string | number> extends EventEmitter {
    protected _id: TId;
    protected _cnf: ModelConfig;
    logger: Logger;

    constructor(id: TId) {
        super();
        this._id = id;
        this.logger = logger.child({ label: this.toString() });

        if (this._cnf) {
            if (typeof this._cnf.maxListeners === 'number') {
                this.setMaxListeners(this._cnf.maxListeners);
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
        return this._id;
    }
}

export default Model;
