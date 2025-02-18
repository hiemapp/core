import * as _ from 'lodash';
import { Constructor, GetPropsType } from '~types/helpers';
import ModelWithProps, { InferSchema } from './ModelWithProps';
import Database from './Database';
import Controller from './Controller';
import Model from './Model';
import { z } from 'zod';
import { getSchemaDefaults, getTypeFromSchema } from '~/utils/zod';

type DatabaseRow = {
    id: number
}

export default function DatabaseController<T extends ModelWithProps>() {
    abstract class DatabaseController extends Controller<T>() {
        static table: string;
        static model: any;

        static update(resource: T): void {
            const fields = _.omit(resource.getProps(), 'id');
            Database.knex(this.table).where({ id: resource.id }).upsert(fields);
        }

        static async create(props: InferSchema<T>) {
            const [id] = await Database.knex(this.table).insert(props).returning('id');
            const row = await Database.knex(this.table).where({ id }).select();
            const resource = this._construct(id, row);
            this.add(resource);
            return resource;
        }

        static async load(model: any): Promise<void> {
            super.load();

            this.model = model;

            const rows: DatabaseRow[] = await Database.knex.select().from(this.table);
            await Promise.all(rows.map(row => {
                const resource = this._construct(row.id, row);
                this.add(resource);
            }));
        }

        static _construct(id: T['id'], row: Record<string, any>) {
            const resource = new this.model(id);

            if (!(resource.$schema instanceof z.ZodObject)) {
                throw new Error(`No '$schema' property defined on model '${resource.constructor.name}'.`)
            }
            
            const props = _.chain(row)
                .omit('id')
                // Convert prop keys to camelCase
                .mapKeys((v, k) => _.camelCase(k)) 
                // Cast values to correct type
                .mapValues((v, k) => {
                    const type = getTypeFromSchema(resource.$schema, k);

                    if(type instanceof z.ZodObject || type instanceof z.ZodRecord) {
                        try {
                            return JSON.parse(v);
                        } catch(err) {
                            return {};
                        }
                    }
                    
                    return v;
                })
                .value();

            resource.$props = props;
            resource._defaultProps = getSchemaDefaults(resource.$schema);

            return resource;
        }
    }

    return DatabaseController;
}
