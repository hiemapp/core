import _ from 'lodash';
import RecordManager from './RecordManager';
import radix64 from '~/utils/radix64';

export type Values = {
    [key: string]: number
}

const RECORD_CELL_DELIMITER = ';';

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

    getDate() {
        return new Date(this._date.getTime());
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
    
    static decompress(compressed: string, manager: RecordManager, doAliasRemap: boolean = true) {
        const cells = compressed.split(RECORD_CELL_DELIMITER);

        const date = new Date(radix64.decodeToInt(cells[0])*1000);
        const values: Record<string, number> = {};
        cells.slice(1).forEach(cell => {
            const alias = cell.slice(0, 1);
            const value = parseFloat(cell.slice(1));

            const key = doAliasRemap ? manager.getField({ alias }).name: alias;
            values[key] = value;
        })

        return new ImmutableRecord(date, values);
    }

    /**
     * Compresses the recording for storage.
     * @param manager - The record manager.
     * @returns - Compressed version of the recording.
     */
    compress(manager: RecordManager): string {
        let cells: string[] = [];

        // For storing the date as a base64url string
        cells[0] = radix64.encodeInt(Math.round(this._date.getTime()/1000));

        _.forOwn(this._values, (value, name) => {
            // Aliases are used to minimize the amount of disk space used
            const field = manager.getField({ name, alias: name });

            const strValue = value+'';
            if(strValue.includes(RECORD_CELL_DELIMITER)) {
                throw new Error(`Value for field '${field.alias}' contains illegal character '${RECORD_CELL_DELIMITER}'`);
            }

            cells.push(`${field.alias}${strValue}`);
        });

        return cells.join(RECORD_CELL_DELIMITER);
    }

    toString() {
        return `[${this.constructor.name} ${this.getDate().toISOString()}]`;
    }
}