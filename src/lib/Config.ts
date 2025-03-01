import path from 'path';
import fs from 'fs/promises';
import _ from 'lodash';
import { dirs } from '../utils/paths';
import { logger } from '../lib/Logger';
import { glob } from 'glob';
import jsonfile from 'jsonfile';

export default class Config {
    private static cache: { [key: string]: any } = {};
    private static rootDir: string;

    static getRootDir() {
        return this.rootDir;
    }

    static async load(rootDir: string) {
        this.rootDir = rootDir;

        // Get all the default and user file paths
        const defaultFilepaths = await glob('default/*.json', { absolute: true, cwd: dirs().CONFIG });
        const userFilepaths = await glob('user/*.json', { absolute: true, cwd: dirs().CONFIG });

        // Read all default config files
        await Promise.all(defaultFilepaths.map(async (filepath) => {
            const filename = path.parse(filepath).name;
            this.cache[filename] = await jsonfile.readFile(filepath);
        }));

        // Read all user config files and replace
        await Promise.all(userFilepaths.map(async (filepath) => {
            const filename = path.parse(filepath).name;

            const contents = await jsonfile.readFile(filepath);
            this.cache[filename] = _.merge(this.cache[filename] ?? {}, contents);
        }));

        console.log(this.get('home'));
    }

    static get(keypath: string): any {
        const value = this.getOrFail(keypath);

        if (typeof value === 'undefined') {
            throw new Error(`Config entry '${keypath}' is undefined.`);
        }

        return value;
    }

    static getOrFail(keypath: string) {
        return keypath.length ? _.get(this.cache, keypath) : this.cache;
    }

    static getOrCreate(keypath: string, newValue: any): any {
        const currentValue = this.getOrFail(keypath);
        if (typeof currentValue !== 'undefined') {
            return currentValue;
        }

        this.update(keypath, newValue);

        if (this.getOrFail(keypath) === newValue) {
            logger.debug(`Created new config entry '${keypath}'.`);
        } else {
            throw new Error(`Failed to create new config entry '${keypath}'.`);
        }

        return newValue;
    }

    static update(keypath: string, value: any) {
        const [filename] = this.splitKeypath(keypath);
        if (typeof this.cache[filename] === 'undefined') {
            return;
        }

        // Update the cache
        _.set(this.cache, keypath, value);

        const filepath = path.join(dirs().CONFIG, filename + '.json');

        // Write the updated data to the file
        return fs.writeFile(filepath, JSON.stringify(this.cache[filename]));
    }

    private static splitKeypath(keypath: string): [string, string] {
        const split = keypath.split('.');
        return [split[0], split.slice(1).join('.')];
    }
}
