import { DataPoint, LTTB } from 'downsample';
import ImmutableRecord from './ImmutableRecord';
import { forOwn } from 'lodash';

export type RecordSamplerDataset = { id: string, values: [ number, number][] };
export type RecordSamplerSerializedRecord = Record<string, number>; 

export default class RecordSampler {
    protected records: ImmutableRecord[];

    constructor(records: ImmutableRecord[]) {
        this.records = records;
    }

    getDatasets() {
        const datasets: Record<string, RecordSamplerDataset> = {};

        this.records.forEach(record => {
            forOwn(record.getValues(), (value, field) => {
                datasets[field] ??= { id: field, values: [] };
                datasets[field].values.push([ record.getDate().getTime(), value ]);
            })
        })

        return Object.values(datasets);
    }
    
    static serialize(datasets: RecordSamplerDataset[]) {
        const records: Record<string, RecordSamplerSerializedRecord> = {};

        datasets.forEach(dataset => {
            dataset.values.forEach(([ time, value ]) => {
                records[time] ??= { '$time': time };
                records[time][dataset.id] = value;
            })
        })

        return Object.values(records); 
    }

    downsample(n: number) {
        return this.getDatasets().map(dataset => ({
            ...dataset,
            values: LTTB(dataset.values, n)
        })) as RecordSamplerDataset[];
    }
}