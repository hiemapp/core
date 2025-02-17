import _ from 'lodash';
import ImmutableRecord from './ImmutableRecord';

export type Values = {
    [key: string]: number
}

export default class MutableRecord extends ImmutableRecord {
    constructor() {
        super(new Date(), {});
    }

    setDate(date: Date) {
        this._date = date;
    }

    addValue(fieldName: string, value: number) {
        if(typeof value !== 'number' || isNaN(value)) {
            throw new Error(`Invalid value for field '${fieldName}': ${value}`);
        }

        // fix 0.1 + 0.2 = 0.300000000004 or 0.79999999999999
        value = _.round(value, 8);

        this._values[fieldName] = value;
    }

    addValues(values: Values) {
        _.forOwn(values, (value, fieldName) => {
            this.addValue(fieldName, value);
        })
    }

    isMutable() {
        return true;
    }

    toImmutable() {
        return new ImmutableRecord(this._date, this._values);
    }
}
