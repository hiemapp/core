import * as _ from 'lodash';
import fs from 'fs/promises';
import { JSONParseOrFail } from '../utils/string';
import { logger } from '../lib/Logger';

export interface TManifestOptions {
    readonly: boolean;
}

export default class Manifest<TData extends {} = {}> {
    private data: TData;
    private filepath?: string;
    private options: TManifestOptions = {
        readonly: false
    }

    constructor(data: TData, filepath?: string, options?: TManifestOptions) {
        this.data = data;
        this.filepath = filepath;

        if(options) {
            this.options = _.defaultsDeep(options, this.options);
        }
    }

    static async fromFile<T extends {} = {}>(filepath: string) {
        const json = await fs.readFile(filepath, 'utf8').catch(err => {
            if(err.code !== 'ENOENT') throw err;
        });

        const data = JSONParseOrFail(json!, {});
        const manifest = new Manifest<T>(data, filepath);
        return manifest;
    }

    isEmpty<K extends keyof TData>(keypath: K): boolean;
    isEmpty(keypath: string): boolean;
    isEmpty(keypath: string): boolean {
        const value = this.get(keypath);

        if(value === null || value === undefined) return true;
        if(typeof value.length === 'number' && value.length === 0) return true;
        if(_.isPlainObject(value) && Object.keys(value).length === 0) return true;

        return false;
    }

    getArr<K extends keyof TData>(keypath: K): Required<TData>[K] extends Array<any> ? Required<TData>[K] : Array<any>;
    getArr(keypath: string): Array<any>;
    getArr(keypath: string): Array<any> {
        const value = this.get(keypath);
        return Array.isArray(value) ? value : [];
    }

    getBool<K extends keyof TData>(keypath: K): TData[K] extends boolean ? TData[K] : boolean;
    getBool(keypath: string): boolean;
    getBool(keypath: string): boolean {
        return !!this.get(keypath);
    }

    isFalse(keypath: string): boolean {
        return this.getBool(keypath) === false;
    }

    isTrue(keypath: string): boolean {
        return this.getBool(keypath) === true;
    }

    isSet(keypath: string): boolean {
        const value = this.get(keypath);
        return typeof value !== 'undefined' && value !== null;
    }

    get<K extends keyof TData>(keypath?: K): TData[K];
    get(keypath: string): any;
    get(keypath: string) {
        return _.get(this.data, keypath);
    }

    set(keypath: string, value: any): this;
    set(newData: Partial<TData>): this;
    set(...args: any[]): this {
        if(this.options.readonly === true) {
            logger.error(new Error(`Manifest can not be modified, because it is readonly.`));
            return this;
        }

        if(typeof args[0] === 'string') {
            _.set(this.data, args[0], args[1]);
        } else {
            this.data = _.defaultsDeep(args[0] ?? {}, this.data);
        }

        // If a filepath is supplied, update the file contents as well
        if (this.filepath) {
            fs.writeFile(this.filepath, JSON.stringify(this.data));
        }

        return this;
    }

    toJSON(): TData {
        const serialized = JSON.stringify(this.data, (key, value) => {
            if(typeof value === 'function') return true;
            return value;
        })
        
        return JSON.parse(serialized);
    }
}