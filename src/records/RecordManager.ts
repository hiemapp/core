import { dirs } from '../utils/paths';
import type Device from '../devices/Device';
import path from 'path';
import dayjs from 'dayjs';
import fs from 'fs/promises';
import ImmutableRecord from './ImmutableRecord';
import _ from 'lodash';
import MutableRecord from './MutableRecord';
import { EOL } from 'os';
import { isValidDate } from '~/utils/date';
import Manifest from '~/utils/Manifest';
import { glob } from 'glob';
import RecordSet from './RecordSet';
import { CustomError } from '~/errors';

export interface RecordManagerField {
    name: string;
    id: number;
    alias: string;
}

export type RecordManagerSortMode = 'TIME_DESCENDING' | 'TIME_ASCENDING';
export type RecordManagerSortFunction = (a: ImmutableRecord | MutableRecord, b: ImmutableRecord | MutableRecord) => boolean;

const MEMORY_FLUSH_COOLDOWN_MILLIS = 100;
const MEMORY_FLUSH_MIN_LENGTH = 10;

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
    private device: Device;
    private baseDir: string;

    private memory: ImmutableRecord[] = [];
    protected index: Manifest<RecordIndex>;
    public fields: RecordManagerField[] = [];

    protected __flushTimeoutId: NodeJS.Timeout;
    protected latestRecord: ImmutableRecord;

    constructor(device: Device) {
        this.device = device;
        this.baseDir = path.resolve(dirs().STORAGE, 'devices', this.device.id.toString(), 'recording');
    }

    async init() {
        if (!this.device.getOption('recording.enabled')) return;

        this.init_loadFields();
        await this.init_loadIndex();
        await this.init_makeDirs().catch(() => null)
        await this.init_checkFileIndex();
    }

    /**
     * Store a new record.
     * @param recording - The record to store.
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

                // Discard the record if the difference is less than the interval
                if (diffMillis < intervalSeconds * 1000) return;
            }

            this.store(record);
        } catch (err: any) {
            this.device.logger.error(`An error occured while storing ${record}: ${err.message}.`);
        }
    }

    async updateFileIndex(date: Date | string | number) {
        const filepath = this.getFilepath(date);
        const filename = path.parse(filepath).name;
        const records = this.sort(await this.readFile(date, false), 'TIME_ASCENDING');
        if (records.length === 0) return;

        this.index.set(`files.${filename}`, {
            name: filename,
            start: records[0].getDate().toString(),
            end: records[records.length - 1].getDate().toString(),
            length: records.length
        })
    }

    getFileIndex(doSort: boolean = false) {
        // Read file index
        const fileIndex = Object.values(this.index.get('files') ?? {});

        // Create date objects
        let hydratedFileIndex = fileIndex.map(file => ({
            ...file,
            start: new Date(file.start),
            end: new Date(file.end)
        }));

        // Sort file index
        if (doSort) {
            hydratedFileIndex = _.sortBy(hydratedFileIndex, file => 1/file.start.getTime());
        }

        return hydratedFileIndex;
    }

    async readLatest(top: number, skip: number = 0, doAliasRemap: boolean = true) {
        const sortedFileIndex = this.getFileIndex(true);
        const filenames = [];

        let totalLength = 0;
        let startSliceIndex = skip;
        for (const file of sortedFileIndex) {
            totalLength += file.length;
            if(totalLength < skip) {
                startSliceIndex -= file.length;
                continue;
            }

            filenames.push(file.name);
            if (totalLength >= skip+top) break;
        }

        const records = this.sort(await this.readFiles(filenames, doAliasRemap), 'TIME_DESCENDING');
        const slicedRecords = records.slice(startSliceIndex, top-skip);

        return new RecordSet(slicedRecords);
    }

    readFiles(dates: (Date|string|number)[], doAliasRemap: boolean = true) {
        return new Promise<ImmutableRecord[]>((resolve, reject) => {
            const promises = dates.map(date => this.readFile(date, doAliasRemap));
            
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

    async readPeriod(start: Date, end: Date, convertAliases: boolean = true) {
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
        const records = await this.readFiles(dates, convertAliases);

        const filteredRecords = records.filter(r => r.getDate().getTime() >= start.getTime() && r.getDate().getTime() <= end.getTime());
        return new RecordSet(filteredRecords);
    }

    sort(records: (ImmutableRecord | MutableRecord)[], mode: RecordManagerSortMode) {
        return records.sort((a, b) => SORT_FUNCTIONS[mode](a, b) ? -1 : 1);
    }

    async readFile(date: Date | number | string, doAliasRemap: boolean = true) {
        return new Promise<ImmutableRecord[]>((resolve, reject) => {
            const filepath = this.getFilepath(date);
            fs.readFile(filepath, 'utf8').then(content => {
                const records: ImmutableRecord[] = [];

                const lines = content.split(/\r?\n/);
                lines.forEach(line => {
                    const record = ImmutableRecord.decompress(line, this, doAliasRemap);
                    if(record.isValid()) {
                        records.push(record);
                    }
                })

                // Append records from memory if the date matches
                this.memory.forEach(record => {
                    if(dayjs(date).isSame(record.getDate(), 'day')) {
                        records.push(record);
                    }
                })

                return resolve(records);    
            }).catch(err => {
                if(err.code !== 'ENOENT') {
                    this.device.logger.error(err);
                }
                
                return resolve([]);
            })
        })
    }

    protected getFilepath(date: number | Date | string) {
        const filename = dayjs(date).format('YYYY-MM-DD');
        return this.resolvePath('./records', filename + '.csv');
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

    protected init_loadFields() {
        const driverManifest = this.device.driver.getManifest(this.device);
        const fields = driverManifest.getArr('device.recording.fields');

        this.fields = [];
        fields.forEach((field: any) => {
            this.fields.push({
                name: field.name,
                id: field.id,
                alias: String.fromCharCode(field.id+65)
            })
        })
    }

    protected async init_loadIndex() {
        const indexFilepath = this.resolvePath('./index.json');
        this.index = await Manifest.fromFile(indexFilepath);
    }

    protected async init_makeDirs() {
        await fs.mkdir(this.resolvePath('./records'));
    }

    protected async init_checkFileIndex() {
        const pattern = this.resolvePath('./records/*.csv').replaceAll('\\', '/');
        const filepaths = await glob.glob(pattern);
        for(const filepath of filepaths) {
            const filename = path.parse(filepath).name;
            await this.updateFileIndex(filename);
        }
        // console.log(this.getFileIndex());
    }

    protected resolvePath(...paths: string[]) {
        return path.resolve(this.baseDir, ...paths);
    }

    private store(record: ImmutableRecord | MutableRecord) {
        // Convert record to immutable
        if (record instanceof MutableRecord) {
            record = record.toImmutable();
        }

        // this.device.logger.debug(`Storing ${record} in memory.`);

        this.memory.push(record);
        this.latestRecord = record;

        // Reset the timeout
        if (this.memory.length >= MEMORY_FLUSH_MIN_LENGTH) {
            clearTimeout(this.__flushTimeoutId);

            this.__flushTimeoutId = setTimeout(() => {
                this.flushMemory();
            }, MEMORY_FLUSH_COOLDOWN_MILLIS);
        }
    }

    protected async flushMemory() {
        const handles: Record<string, fs.FileHandle> = {};

        // Copy and empty the memory
        const memoryCopy = [...this.memory];
        this.memory = [];

        this.device.logger.debug(`Flushing ${memoryCopy.length} record(s) stored in memory to disk.`);

        for (const record of memoryCopy) {
            const filepath = this.getFilepath(record.getDate());
            const compressed = record.compress(this);

            if (!handles[filepath]) {
                handles[filepath] = await fs.open(filepath, 'a');
            }

            handles[filepath].write(compressed + EOL);
        }

        // Close all file handles
        Object.values(handles).forEach(handle => {
            handle.close();
        })
    }

    getField(search: Partial<RecordManagerField>) {
        const field = this.fields.find(f => f.name === search.name || f.id === search.id || f.alias === search.alias);
        if(!field) {
            throw new Error(`Cannot find field with '${JSON.stringify(search)}'.`);
        }
        return field;
    }
}
