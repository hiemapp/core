import * as _ from 'lodash';

/**
 * Similar to Promise.all(), but with an object instead of an array.
 */
async function PromiseAllObject<T>(object: T): Promise<any> {
    return _.zipObject(_.keys(object), await Promise.all(_.values(object)))
}

async function PromiseAllSettledObject<T>(object: T): Promise<any> {
    return _.zipObject(_.keys(object), await Promise.allSettled(_.values(object)))
}


export { PromiseAllObject, PromiseAllSettledObject };
