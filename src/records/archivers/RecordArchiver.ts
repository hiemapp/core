import _ from 'lodash';
import RecordManager from '~/records/RecordManager';
import RecordParser from '../parsers/RecordParser';

export default abstract class RecordArchiver {
    public manager: RecordManager;

    constructor(manager: RecordManager) {
        this.manager = manager;
    }

    static async create<T extends RecordArchiver>(this: new (...args: any[]) => T, manager: RecordManager): Promise<T> {
        const archiver = new this(manager);
        await archiver.init();
        return archiver;
    }

    protected abstract init(): Promise<void>;

    /**
     * Load content from a file.
     * @param parser The parser that compressed the file contents.
     * @param date The date of the file to load.
     * @returns The file contents as a buffer, or false if no file exists.
     */
    abstract load(parser: RecordParser, date: Date): Promise<Buffer|false>;

    /**
     * Save content to a file.
     * @param parser The parser that compressed the file contents.
     * @param date The date of the file to save.
     * @param content The file contents to save.
     */
    abstract save(parser: RecordParser, date: Date, content: Buffer): Promise<void>;

    /**
     * Get a list of dates that the archiver has records for.
     */
    abstract getIndex(): Promise<Date[]> ;

    toString() {
        return `[${this.constructor.name}]`;
    }
}