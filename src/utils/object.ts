import _ from 'lodash';

export function defaultsDeepNull(destination: {}, source: {}): any {
    return _.mergeWith(destination, source, (a, b) =>
        _.isPlainObject(a) ? defaultsDeepNull(a, b) : _.defaultTo(a, b),
    );
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
