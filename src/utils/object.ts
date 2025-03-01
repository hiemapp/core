import _ from 'lodash';

export function defaultsDeepNull(destination: {}, source: {}): any {
    return _.mergeWith(destination, source, (a, b) =>
        _.isPlainObject(a) ? defaultsDeepNull(a, b) : _.defaultTo(a, b),
    );
}
