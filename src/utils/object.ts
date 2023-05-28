import _ from 'lodash';

// Convert {a: {b: 'value'}} to {'a.b': 'value'}
export function flattenKeys(obj: Object, seperator = '.', path: string[] = []): Record<string, any> {
    return !_.isObject(obj)
        ? { [path.join(seperator)]: obj }
        : _.reduce(obj, (cum, next, key) => _.merge(cum, flattenKeys(next, seperator, [...path, key])), {});
}

export function ensureFind<T>(
    array: T[], 
    predicate: (value: T, index: number, obj: T[]) => unknown, 
    error: Error = new Error('Item not found.')
) {
    const result = array.find(predicate);

    if(typeof result === 'undefined') 
        throw error;

    return result;
}
