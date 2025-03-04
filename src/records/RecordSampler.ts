import { DataPoint, LTTB } from 'downsample';
import ImmutableRecord from './ImmutableRecord';
import { forOwn } from 'lodash';

export type RecordSamplerDataset = { id: string, values: [ number, number][] };
export type RecordSamplerSerializedRecord = Record<string, number>; 

export default class RecordSampler {
    static toDatasets(records: ImmutableRecord[]) {
        const datasets: Record<string, RecordSamplerDataset> = {};

        records.forEach((record, index) => {
            forOwn(record.getValues(), (value, field) => {
                datasets[field] ??= { id: field, values: [] };
                datasets[field].values[index] = [ record.getDate().getTime(), value ];
            })
        })

        return Object.values(datasets);
    }
    
    static serialize(datasets: RecordSamplerDataset[]) {
        const records: Record<string, RecordSamplerSerializedRecord> = {};

        datasets.forEach(dataset => {
            dataset.values.forEach(([ time, value ], index) => {
                records[index] ??= { '$time': time };
                records[index][dataset.id] = value;
            })
        })

        return Object.values(records); 
    }

    static downsample(records: ImmutableRecord[], n: number) {
        const datasets = this.toDatasets(records);
        if(n < 1) return datasets;

        return datasets.map(dataset => ({
            ...dataset,
            values: LTTB(dataset.values, n)
        })) as RecordSamplerDataset[];
    }
}