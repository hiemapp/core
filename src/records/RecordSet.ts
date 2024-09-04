import { DataPoint, LTTB } from 'downsample';
import ImmutableRecord from './ImmutableRecord';
import { forOwn } from 'lodash';

export default class RecordSet {
    protected records: ImmutableRecord[];

    constructor(records: ImmutableRecord[]) {
        this.records = records;
    }

    getRecords() {
        return this.records;
    }

    getDataSets() {
        const dataSetsObj: Record<string, any> = {};

        this.records.forEach(record => {
            forOwn(record.getValues(), (value, key) => {
                if(!dataSetsObj[key]) {
                    dataSetsObj[key] = { id: key, values: [] }
                }

                dataSetsObj[key].values.push([ record.getDate().getTime(), value ]);
            })
        })

        const dataSets = Object.values(dataSetsObj);
        return dataSets;
    }

    copy() {
        return new RecordSet([...this.records]);
    }

    downsample(n: number) {
        const dataSets = this.getDataSets();

        return dataSets.map(dataSet => ({
            ...dataSet,
            values: LTTB(dataSet.values, n)
        }))
    }
}