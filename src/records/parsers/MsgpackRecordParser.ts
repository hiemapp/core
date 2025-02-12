import ImmutableRecord from '~/records/ImmutableRecord';
import RecordParser from '~/records/parsers/RecordParser';
import _ from 'lodash';
import { Packr } from 'msgpackr';

export type MsgpackRecordData = Array<[number, Record<string, number>]>;

export default class MsgpackRecordParser extends RecordParser {
    PARSER_ID = 'msgpack';

    protected packr: Packr;

    async init() {
        this.packr = new Packr();
    }

    async decompress(buffer: Buffer) {
        const data: MsgpackRecordData = this.packr.unpack(buffer);
        const records = data.map(([ time, values ]) => new ImmutableRecord(new Date(time), values));
        return records;
    }

    async compress(records: ImmutableRecord[]) {
        const data: MsgpackRecordData = records.map(r => [r.getTime(), r.getValues()]);
        const buffer = this.packr.pack(data);
        return buffer;
    }
}