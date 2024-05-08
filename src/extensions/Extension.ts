import Model, { ModelConfig } from '../lib/Model';
import * as _ from 'lodash';
import * as path from 'path';
import { globSync } from 'glob';
import { type ExtensionModuleName, type ExtensionModuleClass } from './ExtensionModule';
import type Manifest from '../utils/Manifest';
import fs from 'fs';
import ExtensionModuleNotRegisteredError from '../errors/ExtensionModuleNotRegisteredError';
import type { ExtensionType } from './Extension.types';

const GLOB_PATTERN_ASSETS = ['assets/language/*.json'];

interface ExtensionModules {
    [key: string]: {
        [key: string]: (ExtensionModuleClass & any) | undefined;
    };
}

interface ExtensionLib {
    activate: () => void;
}

class Extension extends Model<ExtensionType> {
    public dir: string;
    public modules: ExtensionModules = {};
    public manifest: Manifest;
    private lib: ExtensionLib;

    private loadingModules: string[] = [];

    constructor(manifest: Manifest, dir: string) {
        super(manifest.get('name'));

        this.manifest = manifest;
        this.dir = dir;

        return this;
    }

    /**
     * Register a module.
     * @param moduleClass - The module to register.
     */
    registerModule(
        moduleName: string,
        moduleClass: ExtensionModuleClass,
        typeClass: ExtensionModuleClass,
    ) {
        this.modules[typeClass.name] = this.modules[typeClass.name] || {};
        const moduleSlug = `${this.__modelId}.${moduleName}`;

        // If a module of this type and with this slug already exists, log an error.
        if (this.modules[typeClass.name][moduleName]?.isExtensionModule === true) {
            throw new Error(`${typeClass.name} '${moduleSlug}' was already registered.`);
        }

        this.modules[typeClass.name][moduleName] = moduleClass;

        this.logger.debug(`Registered ${typeClass.name} '${moduleSlug}'.`);
    }

    /**
     * Get a module from the extension.
     * @param type - The type of the module to find.
     * @param name - The name of the module to find.
     * @returns The module.
     */
    getModule<T extends ExtensionModuleClass>(type: T, name: ExtensionModuleName) {
        const module = this.getModuleOrFail(type, name);

        if (module?.isExtensionModule === true) return module;

        throw new ExtensionModuleNotRegisteredError(`${type.name} '${this.__modelId}.${name}' is not registered.`);
    }

    /**
     * Get a module from the extension without throwing an error if it can not be found.
     * @param type - The type of the module to find.
     * @param name - The name of the module to find.
     * @returns The module.
     */
    getModuleOrFail<T extends ExtensionModuleClass>(type: T, name: ExtensionModuleName): T | null {
        if (!_.isPlainObject(this.modules[type.name])) return null;

        const module = this.modules[type.name][name];

        return module?.isExtensionModule === true ? module : null;
    }

    /**
     * Load all assets found in the extension.
     */
    private loadAssets() {
        const filepaths = globSync(GLOB_PATTERN_ASSETS, { cwd: this.dir, absolute: true });

        // this.files['assets'] = {};
        // filepaths.forEach(filepath => {
        //     const asset = new ExtensionAsset(filepath);
        //     this.files['assets'][asset.id] = asset;
        // })

        return this;
    }

    /**
     * Load an extension.
     */
    activate() {
        return new Promise<void>((resolve, reject) => {
            try {
                const mainFilepath = this.getMainFilepath();

                if (!mainFilepath || !fs.existsSync(mainFilepath)) {
                    throw new Error(`Cannot find main file, looked for '${mainFilepath}'.`);
                }

                this.lib = require(mainFilepath);

                // Call the 'activate()' function
                if (typeof this.lib?.activate !== 'function') {
                    throw new Error("No 'activate()' function was exported.");
                }

                this.lib.activate();
                resolve();
            } catch (err: any) {
                reject(err);
            }
        });
    }

    private getMainFilepath() {
        let mainFilepath: string;

        if (process.env.NODE_ENV === 'development') {
            mainFilepath = path.resolve(this.dir, 'src/extension.ts');
            if (fs.existsSync(mainFilepath)) return mainFilepath;
        }

        if (typeof this.manifest.get('main') === 'string') {
            mainFilepath = path.resolve(this.dir, this.manifest.get('main'));
            if (fs.existsSync(mainFilepath)) return mainFilepath;
        }

        mainFilepath = path.resolve(this.dir, 'dist/extension.js');
        if (fs.existsSync(mainFilepath)) return mainFilepath;

        return null;
    }

    static parseModuleSlug(moduleSlug: string) {
        const split = moduleSlug.split('.');

        return [ split[0], split.slice(1).join('.') ];
    }
}

export default Extension;
