import type Device from '../devices/Device';
import dayjs from 'dayjs';
import fs from 'fs/promises';
import ImmutableRecord from './ImmutableRecord';
import _ from 'lodash';
import MutableRecord from './MutableRecord';
import { isValidDate } from '~/utils/date';
import Manifest from '~/utils/Manifest';
import RecordSet from './RecordSampler';
import { CustomError } from '~/errors';
import RecordParser from '~/records/parsers/RecordParser';
import CsvRecordParser from '~/records/parsers/CsvRecordParser';
import { Config } from '~/lib';
import LocalRecordArchiver from './archivers/LocalRecordArchiver';
import RecordArchiver from './archivers/RecordArchiver';
import MsgpackRecordParser from './parsers/MsgpackRecordParser';

export interface RecordManagerField {
    name: string;
    id: number;
}

export type RecordManagerSortMode = 'TIME_DESCENDING' | 'TIME_ASCENDING';
export type RecordManagerSortFunction = (a: ImmutableRecord | MutableRecord, b: ImmutableRecord | MutableRecord) => boolean;

const SORT_FUNCTIONS: Record<RecordManagerSortMode, RecordManagerSortFunction> = {
    TIME_ASCENDING: (a, b) => a.getDate().getTime() < b.getDate().getTime(),
    TIME_DESCENDING: (a, b) => a.getDate().getTime() > b.getDate().getTime()
}

export interface RecordIndex {
    files: {
        [key: string]: {
            name: string;
            start: Date;
            end: Date;
            length: number;
        }
    }
}

export default class RecordManager {
    public readonly device: Device;

    public archivers: RecordArchiver[];
    public parsers: RecordParser[];

    private memory: ImmutableRecord[] = [];
    protected index: Manifest<RecordIndex>;
    public fields: RecordManagerField[] = [];

    protected __flushTimeoutId: NodeJS.Timeout;
    protected latestRecord: ImmutableRecord;

    constructor(device: Device) {
        this.device = device;
    }

    async init() {
        if (!this.device.getOption('recording.enabled')) return;

        // Load recording fields
        const driverManifest = this.device.driver.getManifest(this.device);
        this.fields = driverManifest.getArr('recording.fields');

        // Create parsers
        this.parsers = [
            await MsgpackRecordParser.create(this),
            await CsvRecordParser.create(this)
        ];

        // Create archivers
        this.archivers = [
            await LocalRecordArchiver.create(this)
        ]
    }

    /**
     * Add a new record.
     * @param recording - The record to add.
     */
    add(record: ImmutableRecord | MutableRecord, checkInterval: boolean = false) {
        try {
            // Device option 'recording.enabled' has to be true
            if (this.device.getOption('recording.enabled') !== true) {
                return;
            }

            // If device option 'recording.interval' is greater than 0, check if the new 
            // record was performed at least 'recording.interval' after the latest record. 
            const intervalSeconds = this.device.getOption('recording.interval');
            if (intervalSeconds > 0 && this.latestRecord) {
                const diffMillis = record.getDate().getTime() - this.latestRecord.getDate().getTime();

                // Discard the record if the difference is less than the 95% of the interval
                if (diffMillis < intervalSeconds * 1000 * 0.95) return;
            }

            this.store(record);
        } catch (err: any) {
            this.device.logger.error(`An error occured while storing ${record}: ${err.message}.`);
        }
    }

    /**
     * Read the latest `count` records. Set `count` to -1 to read all records.
     * @param limit The number of records to read.
     * @returns The records.
     */
    async readLatest(limit: number = 100) {
        const indexDates = _.chain(await Promise.all(this.archivers.map(a => a.getIndex())))
            .flatten()
            .uniqBy(d => d.getTime())
            .orderBy(d => d.getTime(), 'desc')
            .value();

        let records: ImmutableRecord[] = [];

        for(const date of indexDates) {
            records.push(...await this.readFile(date));
            records = this.filterRecords(records);

            // Stop if the desired number of records has been read
            if(records.length >= limit || limit < 0) break;
        }

        // Make sure that `records` is not longer than `limit`
        records = records.slice(0, limit);

        return records;
    }

    /**
     * Read all records.
     * @returns All records.
     */
    readAll() {
        return this.readLatest(-1);
    }

    readFiles(dates: Date[]) {
        return new Promise<ImmutableRecord[]>((resolve, reject) => {
            const promises = dates.map(date => this.readFile(date));

            const allRecords: ImmutableRecord[] = [];
            Promise.allSettled(promises).then(results => {
                results.forEach(result => {
                    if (result.status !== 'fulfilled') return;
                    allRecords.push(...result.value);
                })

                return resolve(allRecords);
            })
        })
    }

    async readPeriod(start: Date, end: Date) {
        if (!isValidDate(start)) {
            throw new CustomError({
                message: `Invalid start date: ${start}`,
                status: 400
            })
        }

        if (!isValidDate(end)) {
            throw new CustomError({
                message: `Invalid end date: ${end}`,
                status: 400
            })
        }

        // Make sure that 'start' and 'end' are in the right order.
        [start, end] = start.getTime() <= end.getTime() ? [start, end] : [end, start];

        const dateDiff = dayjs(end).diff(start, 'day');
        const dates = _.times(dateDiff + 1, i => dayjs(start).add(i, 'day').toDate());
        const records = await this.readFiles(dates);

        // Filter records that are not in the selected period
        return records.filter(r => r.getTime() >= start.getTime() && r.getTime() <= end.getTime());
    }

    sort<T extends ImmutableRecord>(records: T[], mode: RecordManagerSortMode): T[] {
        return records.sort((a, b) => SORT_FUNCTIONS[mode](a, b) ? -1 : 1);
    }

    async readFile(date: Date) {
        return new Promise<ImmutableRecord[]>(async (resolve, reject) => {
            const promises: Promise<ImmutableRecord[]>[] = [];
            
            for(const archiver of this.archivers) {
                for(const parser of this.parsers) {
                    promises.push(this._readFileFromArchive(date, archiver, parser))
                }
            }

            let records = _.flatten(await Promise.all(promises));

            // Find records in memory from the same date and append them
            const memoryRecords = this.memory.filter(rd => dayjs(date).isSame(rd.getDate(), 'day'));
            records.push(...memoryRecords);

            records = this.filterRecords(records);

            resolve(records);
        })
    }

    protected async _readFileFromArchive(date: Date, archiver: RecordArchiver, parser: RecordParser) {
        return new Promise<ImmutableRecord[]>((resolve, reject) => {
            archiver.load(parser, date).then(content => {
                if(!(content instanceof Buffer)) return resolve([]);

                parser.decompress(content)
                    .then(records => resolve(records))
                    .catch(err => {
                        this.device.logger.error(`Decompression error (${dayjs(date).format('YYYY-MM-DD')}, ${archiver}, ${parser}):`, err)
                        resolve([]);
                    })
            })

        })
    }

    /**
     * Filters duplicate records from a list.
     * @param records The records to filter.
     * @returns A filtered list of records.
     */
    filterRecords(records: ImmutableRecord[]) {
        return _.uniqBy(records, r => r.getTime());
    }


    // private downsampleRecords(records: SerializedRecord[], target: number) {
    //     const fields = this.config.get('fields');

    //     let pointsByAlias = {};
    //     let downsampledByAlias = {};

    //     // Convert the records to lists of points ([x, y]),
    //     // categorized by the alias of the field
    //     fields.forEach(({ alias }) => {
    //         pointsByAlias[alias] = [];
    //         records.forEach(recording => {
    //             pointsByAlias[alias].push([
    //                 new Date(recording.d).getTime(),
    //                 recording.f[alias]
    //             ])
    //         })
    //     })

    //     _.forOwn(pointsByAlias, (points, alias) => {
    //         downsampledByAlias[alias] = LTTB(points, target);
    //     })

    //     return this.c
    // }

    private store(record: ImmutableRecord | MutableRecord) {
        // Convert record to immutable
        if (record instanceof MutableRecord) {
            record = record.toImmutable();
        }

        this.device.logger.debug(`Storing ${record} in memory.`);

        this.memory.push(record);
        this.latestRecord = record;

        // Save the recordings if the maximum number of recordings in memory is reached
        if (this.memory.length >= Config.get('system.devices.recording.memorySize')) {
            this.archiveMemory();
        }
    }

    /**
     * The primary archiver is the archiver used for saving files.
     * @returns The primary archiver.
     */
    getPrimaryArchiver() {
        return this.archivers[0];
    }

    /**
     * The primary archiver is the archiver used for saving files.
     * @returns The primary archiver.
     */
    getPrimaryParser() {
        return this.parsers[0];
    }

    /**
     * Archive the current memory.
     */
    async archiveMemory() {
        // Copy and empty the memory
        const memory = [...this.memory];
        this.memory = [];

        // Save the records
        const start = Date.now();
        await this.archiveRecords(memory);
        
        this.device.logger.debug(`Saving ${memory.length} record(s) took ${Date.now()-start}ms...`);
    }

    /**
     * Compress and archive records.
     * @param records The records to save, which can be of various dates.
     */
    async archiveRecords(records: ImmutableRecord[]) {
        const groupedRecords = this._groupRecords(records);

        const archiver = this.getPrimaryArchiver();
        const parser = this.getPrimaryParser();

        await Promise.all(groupedRecords.map(async ({ date, records }) => {
            const allRecords = await this.readFile(date);
            allRecords.push(...records);
            
            await parser.compress(allRecords)
                .then(content => archiver.save(parser, date, content))
                .catch(err => this.device.logger.error(`Compression error (${dayjs(date).format('YYYY-MM-DD')}, ${archiver}, ${parser}):`, err));
        }))
    }

    /**
     * Groups records by date.
     * @param records The records to group.
     */
    protected _groupRecords(records: ImmutableRecord[]): { date: Date, records: ImmutableRecord[] }[] {
        const groupedRecords = _.groupBy(records, rd => dayjs(rd.getDate()).format('YYYY-MM-DD'));
        return _.map(_.entries(groupedRecords), ([k, v]) => ({ date: new Date(k), records: v }))
    }

    getField(search: Partial<RecordManagerField>) {
        const field = this.fields.find(f => f.name === search.name || f.id === search.id);
        if (!field) {
            throw new Error(`Cannot find field with '${JSON.stringify(search)}'.`);
        }
        return field;
    }
}
