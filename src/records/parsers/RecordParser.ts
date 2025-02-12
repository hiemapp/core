import dayjs from 'dayjs';
import _ from 'lodash';
import ImmutableRecord from '~/records/ImmutableRecord';
import RecordManager from '~/records/RecordManager';

export default abstract class RecordParser {
    public abstract readonly PARSER_ID: string;

    public manager: RecordManager;

    constructor(manager: RecordManager) {
        this.manager = manager;
    }

    static async create<T extends RecordParser>(this: new (...args: any[]) => T, manager: RecordManager): Promise<T> {
        const archiver = new this(manager);
        await archiver.init();
        return archiver;
    }

    protected abstract init(): Promise<void>;

    abstract decompress(buffer: Buffer): Promise<ImmutableRecord[]>;

    abstract compress(records: ImmutableRecord[]): Promise<Buffer>;

    toString() {
        return `[${this.constructor.name}]`;
    }
}