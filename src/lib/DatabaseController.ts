import * as _ from 'lodash';
import ModelWithProps, { InferProps } from './ModelWithProps';
import Database from './Database';
import Controller from './Controller';
import { z } from 'zod';
import { getSchemaDefaults, getTypeFromSchema } from '~/utils/zod';
import { logger } from './Logger';
import { ObjectId } from 'mongodb';

type DatabaseRow = {
    id: number
}

export default function DatabaseController<T extends ModelWithProps>() {
    abstract class DatabaseController extends Controller<T>() {
        static table: string;
        static model: any;

        static async delete(id: any) {
            await Database.client.db().collection(this.table).deleteOne({ _id: id });
            delete this.data[id];
        }

        static find(id: string|number|ObjectId) {
            return super.find(id instanceof ObjectId ? id.toString() : id);
        }

        static async update(resource: T): Promise<void> {
            await Database.collection(this.table).updateOne(
                { _id: resource.id }, 
                { $set: _.omit(resource.getProps(), 'id') });
        }

        static async create(props: InferProps<T>) {
            const { insertedId } = await Database.collection(this.table).insertOne(props);
            const resource = await this._construct({ ...props, _id: insertedId });

            this.add(resource);
            return resource;
        }

        static async load(model: any): Promise<void> {
            await super.load(model);

            const documents = Database.collection(this.table).find();
            for await (const document of documents) {
                const resource = await this._construct(document);
                this.add(resource);
            }
        }

        static async _construct(document: Record<string, any>) {
            const resource = new this.model(document._id.toString());

            if (!(resource.$schema instanceof z.ZodObject)) {
                throw new Error(`No '$schema' property defined on model '${resource.constructor.name}'.`)
            }
            
            resource.$props = _.omit(document, '_id');
            resource._defaultProps = getSchemaDefaults(resource.$schema);

            await resource.__init();

            return resource;
        }
    }

    return DatabaseController;
}
