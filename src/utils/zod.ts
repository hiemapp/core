import _ from 'lodash';
import z from 'zod'

export function getDefaults<Schema extends z.AnyZodObject>(schema: Schema, recursive = false): z.infer<Schema> {
    return _.mapValues(schema.shape, (value, key) => {
        if (value instanceof z.ZodDefault) return value._def.defaultValue();
        if (value instanceof z.ZodNullable) return null;
        if (recursive && value instanceof z.ZodObject) return getDefaults(value, recursive);
    })
}