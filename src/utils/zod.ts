import _ from 'lodash';
import z from 'zod'

export function getSchemaDefaults<Schema extends z.AnyZodObject>(schema: Schema, recursive = false): z.infer<Schema> {
    return _.mapValues(schema.shape, (value, key) => {
        if (value instanceof z.ZodDefault) return value._def.defaultValue();
        if (value instanceof z.ZodNullable) return null;
        if (recursive && value instanceof z.ZodObject) return getSchemaDefaults(value, recursive);
    })
}

export function getTypeFromSchema<Schema extends z.AnyZodObject, Key extends keyof Schema>(schema: Schema, key: Key) {
    let type = schema.shape[key];
    type = type instanceof z.ZodDefault ? type.removeDefault() : type;
    return type;
}