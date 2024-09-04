import * as _ from 'lodash';
import { Constructor } from '~types/helpers';
import ModelWithProps from './ModelWithProps';
import Database from './Database';
import Controller from './Controller';

type DatabaseRow = {
    id: number
}

export default function ControllerDatabase<T extends ModelWithProps<any>>() {
    abstract class ControllerDatabase extends Controller<T>() {
        static table: string;

        static update(id: number, model: T): void {
            const fields = _.omit(model.getProps(), 'id');
            const serializedFields = Database.serializeFields(fields);

            Database.query(`UPDATE \`${this.getEscapedTable()}\` SET ${serializedFields} WHERE \`id\` = ?`, [id]);
        }

        static async load(model: Constructor<T>, callback?: (row: any, rows: any[]) => T): Promise<void> {
            let data: Record<number, T> = {};

            const rows: DatabaseRow[] = await Database.query(`SELECT * from \`${this.getEscapedTable()}\``);

            rows.forEach((row) => {
                if (typeof callback === 'function') {
                    data[row.id] = callback(row, rows);
                    return;
                }
                
                data[row.id] = new model(row.id, _.omit(row, 'id'));
            });
            
            // Call the .init() method on each model
            await Promise.all(Object.values(data).map(m => m.__init()));

            this.store(data);
        }

        static getEscapedTable() {
            if (typeof this.table !== 'string') {
                throw new Error(`Static property 'table' in ${this.name} must be string.`);
            }

            return Database.escapeSQLWord(this.table);
        }
    }

    return ControllerDatabase;
}
