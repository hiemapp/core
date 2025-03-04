import path from 'path';
import fs from 'fs/promises';
import _ from 'lodash';
import { dirs } from '../utils/paths';
import { logger } from '../lib/Logger';
import { glob } from 'glob';
import jsonfile from 'jsonfile';

export default class Config {
    protected static defaultConfig: Record<string, any> = {};
    protected static userConfig: Record<string, any> = {};
    protected static mergedConfig: Record<string, any> = {};
    private static rootDir: string;

    static getRootDir() {
        return this.rootDir;
    }

    static async load(rootDir: string) {
        this.rootDir = rootDir;

        this.defaultConfig = await this.readConfig('default');
        this.userConfig = await this.readConfig('user');
        
        this.updateMergedConfig();
    }

    /**
     * Merge `this.userConfig` and `this.defaultConfig` to `this.mergedConfig`.
     */
    protected static updateMergedConfig() {
        _.defaultsDeep(this.mergedConfig, this.defaultConfig, this.userConfig);
    }

    protected static async readConfig(dir: string) {
        const filepaths = await glob('*.json', { absolute: true, cwd: path.join(dirs().CONFIG, dir) });
        const config: Record<string, any> = {};

        await Promise.all(filepaths.map(async filepath => {
            const filename = path.parse(filepath).name;
            config[filename] = await jsonfile.readFile(filepath);
        }));

        return config;
    }

    static get(keypath: string): any {
        const value = this.getOrFail(keypath);

        if (typeof value === 'undefined') {
            throw new Error(`Config entry '${keypath}' is undefined.`);
        }

        return value;
    }

    static getOrFail(keypath: string) {
        return keypath.length ? _.get(this.mergedConfig, keypath) : this.mergedConfig;
    }

    static getOrCreate(keypath: string, callback: () => unknown): any {
        const currentValue = this.getOrFail(keypath);
        if (typeof currentValue !== 'undefined') return currentValue;

        const newValue = callback();
        this.update(keypath, newValue);

        if (this.getOrFail(keypath) === newValue) {
            logger.debug(`Set config item '${keypath}' to ${JSON.stringify(newValue)}`);
        } else {
            throw new Error(`Failed to set config item '${keypath}'`);
        }

        return newValue;
    }

    /**
     * Modify the user config.
     * @param keypath The keypath of the item to modify.
     * @param value The new value.
     */
    static update(keypath: string, value: any): void {
        const [filename] = this.splitKeypath(keypath);
        if (!this.mergedConfig[filename]) return;

        // Update the config in memory
        _.set(this.userConfig, keypath, value);
        this.updateMergedConfig();

        const filepath = path.join(dirs().CONFIG, 'user', filename + '.json');

        // Write the updated data to the file
        jsonfile.writeFile(filepath, this.userConfig[filename]);
    }

    private static splitKeypath(keypath: string): [string, string] {
        const split = keypath.split('.');
        return [split[0], split.slice(1).join('.')];
    }
}
