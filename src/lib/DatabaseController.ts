import * as _ from 'lodash';
import { Constructor, GetPropsType } from '~types/helpers';
import ModelWithProps, { InferSchema } from './ModelWithProps';
import Database from './Database';
import Controller from './Controller';

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
            const [ id ] = await Database.knex(this.table).insert(props).returning('id');
            return this._construct(id, props);
        }

        static async load(model: any): Promise<void> {
            super.load();

            this.model = model;

            const rows: DatabaseRow[] = await Database.knex.select().from(this.table);
            const resources = await Promise.all(rows.map(row => {
                // Convert prop keys to camelCase
                const props = _.chain(row)
                    .omit('id')
                    .mapKeys((v, k) => _.camelCase(k))
                    .value();

                return this._construct(row.id, props);
            }));

            const data = _.keyBy(resources, 'id') as any;
            this.store(data);
        }

        static _construct(id: T['id'], props: any) {
            return this.model.fromProps(id, props);
        }
    }

    return DatabaseController;
}
