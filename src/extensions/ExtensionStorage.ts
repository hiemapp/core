import { dirs } from '~/utils';
import path from 'path';
import fs from 'fs/promises';
import sanitize from 'sanitize-filename';
import { resolveExtensionFromStack } from './utils';
import Extension from './Extension';
import _ from 'lodash';
import { Database } from '~/lib';
import { ObjectId } from 'mongodb';

export type TData = Record<string|number, any>;

export interface CacheOptions {
    persistent?: boolean
}

export default class ExtensionStorage<T extends TData = TData> {
    protected data: T = {} as any;
    protected extension: Extension;
    protected name: string;
    protected id: string;

    static async load(name: string) {
        const storage = new ExtensionStorage(name);
        await storage.write();
        return storage;
    }

    constructor(name: string) {
        const extension = resolveExtensionFromStack();

        this.name = name;
        this.extension = extension;

        this.id = `${this.extension.id}.${this.name}`;
    }

    async update<TKey extends keyof T>(key: TKey, value: T[TKey]): Promise<void>;
    async update(key: string, value: any): Promise<void> {
        const merged = _.defaultsDeep(value, _.get(this.data, key));
        _.set(this.data, key, merged);
        await this.write();
    }

    async set<TKey extends keyof T>(key: TKey, value: T[TKey]): Promise<void>;
    async set(key: string, value: any): Promise<void> {
        _.set(this.data, key, value);
        await this.write();
    }

    get(): T;
    get<TKey extends keyof T>(key: TKey): T[TKey];
    get(key: string|number): any;
    get(...args: any[]): any {
        if(typeof args[0] === 'string') {
            return _.get(this.data, args[0]);
        }
        
        return {...this.data};
    }
    
    protected async write() {
        return await Database.collection('extension_storage')
            .updateOne({ id: this.id }, { $set: { data: this.data } }, { upsert: true });
    }

    protected async read() {
        const item = await Database.collection('extension_storage').findOne({ id: this.id });
        if(!item) return false;

        this.data = item.data;
        return true;
    }
}