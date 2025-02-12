import { DataPoint, LTTB } from 'downsample';
import ImmutableRecord from './ImmutableRecord';
import { forOwn } from 'lodash';

export default class RecordSampler {
    protected records: ImmutableRecord[];

    constructor(records: ImmutableRecord[]) {
        this.records = records;
    }

    getDatasets() {
        const datasetsObj: Record<string, any> = {};

        this.records.forEach(record => {
            forOwn(record.getValues(), (value, field) => {
                datasetsObj[field] ??= { id: field, values: [] };
                datasetsObj[field].values.push([ record.getDate().getTime(), value ]);
            })
        })

        return Object.values(datasetsObj);
    }

    downsample(n: number) {
        return  this.getDatasets().map(dataset => ({
            ...dataset,
            values: LTTB(dataset.values, n)
        }))
    }
}