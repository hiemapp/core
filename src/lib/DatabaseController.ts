import * as _ from 'lodash';
import ModelWithProps, { InferProps } from './ModelWithProps';
import Database from './Database';
import Controller from './Controller';
import { z } from 'zod';
import { getSchemaDefaults, getTypeFromSchema } from '~/utils/zod';
import { logger } from './Logger';

type DatabaseRow = {
    id: number
}

export default function DatabaseController<T extends ModelWithProps>() {
    abstract class DatabaseController extends Controller<T>() {
        static table: string;
        static model: any;

        static async delete(id: any) {
            await Database.knex(this.table).where({ id }).delete().catch(err => {
                logger.error(err);
            });
        }

        static async update(resource: T): Promise<void> {
            const fields = this._propsToFields(resource.getProps());
            await Database.knex(this.table).where({ id: resource.id }).update(fields).catch(err => {
                resource.logger.error(err);
            });
        }

        static async create(props: InferProps<T>) {
            const insertFields = this._propsToFields(props);
            const [id] = await Database.knex(this.table).insert(insertFields);
            
            const [fields] = await Database.knex(this.table).where({ id }).select();
            const resource = await this._construct(fields);
            this.add(resource);
            return resource;
        }

        static async load(model: any): Promise<void> {
            await super.load(model);

            const rows: DatabaseRow[] = await Database.knex.select().from(this.table);
            await Promise.all(rows.map(async fields => {
                const resource = await this._construct(fields);
                this.add(resource);
            }));
        }

        static _propsToFields(props: Record<string, any>) {
            return _.chain(props)
                .omit('id')
                .mapKeys((v, k: string) => _.snakeCase(k)) 

                // serialize json objects
                .mapValues(v => _.isPlainObject(v) ? JSON.stringify(v) : v)
                .value();
        }

        static _fieldsToProps(fields: Record<string, any>, resource: any) {
            return _.chain(fields)
                .omit('id', 'changed_at', 'updated_at')
                .mapKeys((v, k) => _.camelCase(k)) 

                // deserialize json objects
                .mapValues((v, k) => {
                    const type = getTypeFromSchema(resource.$schema, k);

                    if(type instanceof z.ZodObject || type instanceof z.ZodRecord) {
                        try {
                            return JSON.parse(typeof v === 'string' ? v : '{}');
                        } catch(err) {
                            return {};
                        }
                    }
                    
                    return v;
                })
                .value();
        }

        static async _construct(fields: Record<string, any>) {
            const resource = new this.model(fields.id);

            if (!(resource.$schema instanceof z.ZodObject)) {
                throw new Error(`No '$schema' property defined on model '${resource.constructor.name}'.`)
            }
            
            resource.$props = this._fieldsToProps(fields, resource);
            resource._defaultProps = getSchemaDefaults(resource.$schema);

            await resource.__init();

            return resource;
        }
    }

    return DatabaseController;
}
