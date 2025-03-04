import { z } from 'zod';
import ModelWithProps, { InferSchema } from '~/lib/ModelWithProps';

export default class Task extends ModelWithProps {
    protected $schema = z.object({
        id: z.number(),
        date: z.date().nullable(),
        interval: z.string().nullable(),
        keyword: z.string(),
        data: z.record(z.string(), z.any()),
        meta: z.record(z.string(), z.any())
    })

    static create(props: InferSchema<Task>) {
        const task = new Task(props.id);
        task.$props = props;
        return task;
    }
    
    getInterval() { return this.getProp('interval'); }
    getDate() { return this.getProp('date'); }
    getKeyword() { return this.getProp('keyword'); }
    getMeta() { return this.getProp('meta'); }
    getData() { return this.getProp('data'); }
}