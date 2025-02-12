import _ from 'lodash';
import RecordManager from './RecordManager';
import radix64 from '~/utils/radix64';

export type Values = {
    [key: string]: number
}

export default class ImmutableRecord {
    protected _date: Date;
    protected _values: Values = {};

    constructor(date: Date, values: Values) {
        this._date = date;
        this._values = values;
    }
    
    isMutable() {
        return false;
    }

    getTime() {
        return this._date.getTime();
    }

    getDate() {
        return new Date(this.getTime());
    }

    getValues() {
        return {...this._values};
    }

    getValue(fieldId: string, fallback: any = 0) {
        return this.getValues()[fieldId] ?? fallback;
    }

    toJSON() {
        return [ this._date, this._values ];
    }

    isValid() {
        return !isNaN(this._date.getTime());
    }
    
    toString() {
        return `[${this.constructor.name} ${this.getDate().toISOString()}]`;
    }
}