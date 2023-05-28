import { getDir } from '../utils/paths';
import type Device from '../devices/Device';
import Record, { SerializedRecord } from './Record';
import path from 'path';
import dayjs from 'dayjs';
import ImmutableRecord from './ImmutableRecord';
import { glob } from 'glob';
import fs from 'fs/promises';
import _ from 'lodash';
import randomstring from 'randomstring';
import Manifest from '../utils/Manifest';
import { JSONParseOrFail } from '../utils/string';
import { PromiseAllSettledObject } from '../utils/Promise';

export interface Field {
    alias: string;
}

export interface RecordManagerConfig {
    fields: {
        [key: string]: Field;
    };
}

export default class RecordManager {
    private device: Device;
    private dir: string;
    private latestRecord: ImmutableRecord;
    public config: Manifest<RecordManagerConfig>;
    private recordsInMemory: ImmutableRecord[] = [];

    constructor(device: Device) {
        this.device = device;
        this.dir = path.join(getDir('STORAGE'), 'devices', this.device.getId().toString(), 'records');

        this.loadConfig().then((config) => {
            this.config = config;
        });
    }

    /**
     * Store a new record.
     * @param recording - The record to store.
     */
    push(record: Record) {
        try {
            // Check if the record config has to be loaded
            if (!this.config) {
                throw new Error('Recording config not loaded.');
            }

            // Device option 'recording.enabled' has to be true
            if (this.device.getOption('recording.enabled') !== true) {
                return;
            }

            // If device option 'recording.cooldown' is more than or equal to 1,
            // check if the new record was performed at least 'recording.cooldown' after
            // the latest record. If it does not, return.
            const cooldownSeconds = this.device.getOption('recording.cooldown');
            if (cooldownSeconds > 0) {
                if (this.latestRecord?.date) {
                    const diffSeconds = Math.round((record.date.getTime() - this.latestRecord.date.getTime()) / 1000);
                    if (diffSeconds < cooldownSeconds) {
                        this.device.logger.debug(
                            `Discarding new record because the 'recording.cooldown' option of ${cooldownSeconds}s is not met. (${diffSeconds}s).`,
                        );
                        return;
                    }
                }
            }

            this.store(record);
        } catch (err: any) {
            this.device.logger.error(`An error occured while storing a new record: ${err.message}.`);
        }
    }

    /**
     * Read the latest n records.
     * @param top - The number of records to read
     * @returns The found records.
     */
    async readTop(top: number = 50) {
        let records: ImmutableRecord[] = [];

        const dates = await this.listDates(true);

        for (const date of dates) {
            if (records.length >= top) break;

            const recordsForDate = await this.readFile(date);
            records = records.concat(recordsForDate);
        }

        // Append the records stored in memory. They might be of an
        // earlier date, so we add them after top has been reached
        records = records.concat(this.recordsInMemory);

        return this.sortRecords(records).slice(-top);
    }

    async readPeriod(from: Date, to: Date) {
        const daysDiff = dayjs(from).diff(to, 'day');

        let records: SerializedRecord[] = [];

        let currentDate = new Date();
        Promise.allSettled(
            _.map([...new Array(daysDiff)], () => {
                currentDate = dayjs(currentDate).add(1, 'day').toDate();
                return this.readFile(currentDate);
            }),
        ).then((results) => {
            // TODO: implement
            // console.log(results);
        });

        return records;
    }

    readFile(date: Date | number | string) {
        return new Promise<ImmutableRecord[]>((resolve, reject) => {
            const filepath = this.getFilepath(date);
            fs.readFile(filepath, 'utf8')
                .then((json) => {
                    const records: SerializedRecord[] = JSONParseOrFail(json);
                    const immutableRecords = records.map(r => new ImmutableRecord(r));
                    return resolve(immutableRecords);
                })
                .catch(reject);
        });
    }

    writeFile(date: Date | number | string, records: SerializedRecord[]) {
        return new Promise<void>((resolve, reject) => {
            const filepath = this.getFilepath(date);
            fs.writeFile(filepath, JSON.stringify(records));
        });
    }

    /**
     * Generate a new unique alias.
     */
    generateUniqueFieldAlias() {
        let alias: string | false = false;

        const fields = this.config.get('fields');

        // Generate a new alias (try again if the generated alias is already in use)
        while (!alias || _.some(fields, (f: Field) => f.alias === alias)) {
            alias = randomstring.generate(2);
        }

        return alias;
    }

    storeFieldAlias(field: string, alias: string) {
        this.config.set(`fields.${field}.alias`, alias);
    }

    /**
     * Get a list of dates for which records exist. Useful in combination with this.readFile().
     * @param sort - Whether the dates should be sorted.
     * @returns The list of dates.
     */
    private async listDates(sort: boolean = false): Promise<Date[]> {
        // Replace all backslashes with forward slashes
        const pattern = path.join(this.dir, 'by-date', '*.json').replace(/\\/g, '/');
        const filepaths = await glob(pattern, { absolute: true });
        let dates = filepaths.map((filepath) => new Date(path.parse(filepath).name));

        if (sort) {
            dates = dates.sort((a, b) => (a.getTime() < b.getTime() ? 1 : -1));
        }

        return dates;
    }

    private getFilepath(date: number | Date | string) {
        let dateString = dayjs(date).format('YYYY-MM-DD');
        const filepath = path.join(this.dir, 'by-date', path.basename(dateString) + '.json');
        return filepath;
    }

    /**
     * Sort records from newest to oldest.
     * @param records - The records to sort.
     * @returns The sorted records.
     */
    private sortRecords(records: ImmutableRecord[]) {
        return records.sort((a, b) => (a.time! < b.time! ? 1 : -1));
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

    private async loadConfig() {
        const filepath = path.join(this.dir, 'config.json');
        return await Manifest.fromFile<RecordManagerConfig>(filepath);
    }

    private store(recording: Record) {
        if (!(recording instanceof Record)) return;

        // Add the recording to memory.
        this.recordsInMemory.push(recording.toImmutable(this));
        this.device.logger.debug(`Stored ${recording} in memory.`);

        // Find the latest recording.
        this.latestRecord = _.maxBy(this.recordsInMemory, (r) => r.date.getTime())!;

        // Store the records in the file system and flush the
        // recording memory if the interval has been reached.
        const flushThreshold = this.device.getOption('recording.flushThreshold');
        if (this.recordsInMemory.length >= flushThreshold) {
            this.storeInFileSystem(this.recordsInMemory).then((length) => {
                this.device.logger.debug(`Flushed ${length} recording(s) to the file system.`);
            });

            // Clear the memory
            this.recordsInMemory = [];
        }
    }

    private storeInFileSystem(records: ImmutableRecord[]) {
        return new Promise<number>(async (resolve, reject) => {
            try {
                // The directory in which the records are stored.
                const dir = path.join(this.dir, 'by-date');

                // Create diretory if it doesn't exist.
                await fs.access(dir).catch(() => fs.mkdir(dir, { recursive: true }));

                // Subdivide records by date.
                const recordsByDate: {[key: string]: ImmutableRecord[]} = {};
                records.forEach((recording) => {
                    const formattedDate = dayjs(recording.date).format('YYYY-MM-DD');
                    recordsByDate[formattedDate] = recordsByDate[formattedDate] ?? [];
                    recordsByDate[formattedDate].push(recording);
                });

                // Read the existing records from the files.
                const results = await PromiseAllSettledObject(
                    _.mapValues(recordsByDate, (v, formattedDate: string) => this.readFile(formattedDate)),
                );

                _.forOwn(results, (result: any, formattedDate) => {
                    const existingRecords: SerializedRecord[] = result?.value || [];

                    // Serialize all records for this date.
                    const serializedRecords = _.map(recordsByDate[formattedDate], (r) => r.serialize());

                    // Append the new records to the existing records.
                    const mergedRecords = existingRecords.concat(serializedRecords);

                    this.writeFile(formattedDate, mergedRecords);
                });

                return resolve(records.length);
            } catch (err: any) {
                this.device.logger.error('An error occured while storing recording:', { meta: err });
                return reject(err);
            }
        });
    }
}
