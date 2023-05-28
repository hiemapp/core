import { SerializedRecord } from './Record';

export default class ImmutableRecord {
    private serialized: SerializedRecord;
    readonly date: Date;
    readonly values: Record<string, number>;
    readonly time: number;

    constructor(serialized: SerializedRecord) {
        this.date = new Date(serialized.d);
        this.values = serialized.v;
        this.time = this.date.getTime();
    }

    serialize() {
        return this.serialized;
    }
}