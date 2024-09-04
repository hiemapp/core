import { dirs } from '~/utils';
import path from 'path';
import fs from 'fs/promises';
import sanitize from 'sanitize-filename';
import { resolveExtensionFromStack } from './utils';
import Extension from './Extension';
import _ from 'lodash';

export type TData = Record<string|number, any>;

export interface CacheOptions {
    persistent?: boolean
}

export default class ExtensionStorage<T extends TData = TData> {
    protected __cache: T = {} as any;
    protected __extension: Extension;
    protected dir: string;
    protected datafile: string;
    protected id: string;

    static async load(id: string) {
        const storage = new ExtensionStorage(id);
        await storage.refresh();
        return storage;
    }

    constructor(id: string) {
        const extension = resolveExtensionFromStack();

        this.id = id;
        this.__extension = extension;

        // Create directory
        this.dir = path.join(dirs().STORAGE, 'extensiondata', sanitize(this.__extension.id), sanitize(id));
        fs.mkdir(this.dir, { recursive: true }).catch(() => {
            this.__extension.logger.error(`Failed to create storage directory '${this.dir}'.`);
        });
        
        this.datafile = path.join(this.dir, 'data.json');
    }

    async update<TKey extends keyof T>(key: TKey, value: T[TKey]) {
        const merged = _.defaultsDeep(value, _.get(this.__cache, key));
        _.set(this.__cache, key, merged);
        await this.flush();
    }

    async set<TKey extends keyof T>(key: TKey, value: T[TKey]) {
        _.set(this.__cache, key, value);
        await this.flush();
    }

    async flush() {
        await fs.writeFile(this.datafile, JSON.stringify(this.__cache));
    }

    get(): T;
    get<TKey extends keyof T>(key: TKey): T[TKey];
    get(key: string|number): any;
    get(...args: any[]): any {
        if(typeof args[0] === 'string') {
            return _.get(this.__cache, args[0]);
        }
        
        return {...this.__cache};
    }

    async createFile(filename: string) {
        const filepath = path.join(this.dir, sanitize(filename));

        // Create a new empty file
        let fh = await fs.open(filepath, 'a');
        await fh.close();

        return filepath;
    }

    async refresh() {
        try {
            const content = await fs.readFile(this.datafile, 'utf8').catch(() => '{}');
            this.__cache = JSON.parse(content);
        } catch(err) {
            this.__cache = {} as any;
        }
    }
}