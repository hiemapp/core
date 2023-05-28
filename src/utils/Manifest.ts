import * as _ from 'lodash';
import { validate } from './validation';
import fs from 'fs';
import { JSONParseOrFail } from '../utils/string';

export default class Manifest<T extends Object = Object> {
    private data: T;
    private filepath?: string;

    constructor(data: T, filepath?: string) {
        this.data = data;
        this.filepath = filepath;
    }

    static fromFile<T extends Object = Object>(filepath: string) {
        return new Promise<Manifest<T>>((resolve, reject) => {
            fs.access(filepath, (err) => {
                fs.readFile(filepath, 'utf8', (err, json) => {
                    const data = JSONParseOrFail(json, {});
                    return resolve(new Manifest(data, filepath));
                });
            });
        });
    }

    static fromFileSync<T extends Object = Object>(filepath: string) {
        let data = {};

        if (fs.existsSync(filepath)) {
            data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }

        return new Manifest<T>(data as T, filepath);
    }

    isFalse(keypath: string): boolean {
        return !this.get(keypath);
    }

    isTrue(keypath: string): boolean {
        return !this.isFalse(keypath);
    }

    isSet(keypath: string): boolean {
        const value = this.get(keypath);
        return typeof value !== 'undefined' && value !== null;
    }

    get(): T;
    get<K extends keyof T>(keypath?: K): T[K];
    get(keypath?: string): any;
    get(keypath?: string) {
        if (!keypath) return this.data;
        return _.get(this.data, keypath);
    }

    set(keypath: string, value: any): this {
        _.set(this.data, keypath, value);

        // If a filepath is supplied, update the file contents as well
        if (this.filepath) {
            fs.writeFile(this.filepath, JSON.stringify(this.data), (err) => {
                if (err) throw err;
            });
        }

        return this;
    }
}
