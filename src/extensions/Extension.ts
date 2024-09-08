import Model, { ModelConfig } from '../lib/Model';
import * as _ from 'lodash';
import * as path from 'path';
import { globSync } from 'glob';
import ExtensionModule, { type ExtensionModuleName } from './ExtensionModule';
import type Manifest from '../utils/Manifest';
import fs from 'fs';
import ExtensionModuleNotRegisteredError from '../errors/ExtensionModuleNotRegisteredError';
import type { ExtensionType } from './Extension.types';
import { Constructor } from '~types/helpers';
import Timer from '~/lib/Timer';

const GLOB_PATTERN_ASSETS = ['assets/language/*.json'];

interface ExtensionModules {
    [key: string]: {
        [key: string]: ExtensionModule;
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

    constructor(manifest: Manifest, dir: string) {
        super(manifest.get('name'));

        this.manifest = manifest;
        this.dir = dir;

        return this;
    }

    /**
     * Register a module.
     * @param extModule - The module to register.
     */
    registerModule(extModule: ExtensionModule) {
        const { type, name } = extModule.$module;

        this.modules[type.name] ??= {};
        this.modules[type.name][name] = extModule;

        this.logger.debug(`Registered ${extModule}.`);
    }

    /**
     * Get a module from the extension.
     * @param type - The type of the module to find.
     * @param name - The name of the module to find.
     * @returns The module.
     */
    getModule<T extends ExtensionModule>(type: Constructor<T>, name: ExtensionModuleName): T {
        const module = this.getModuleOrFail(type, name);

        if (!module) {
            throw new ExtensionModuleNotRegisteredError(`${type.name} '${this.__modelId}.${name}' is not registered.`);
        }

        return module;
    }

    /**
     * Get a module from the extension without throwing an error if it can not be found.
     * @param type - The type of the module to find.
     * @param name - The name of the module to find.
     * @returns The module.
     */
    getModuleOrFail<T extends ExtensionModule>(type: Constructor<T>, name: ExtensionModuleName): T | null {
        if (!_.isPlainObject(this.modules[type.name])) return null;

        const extModule = this.modules[type.name][name];

        if(!(extModule instanceof ExtensionModule)) return null;

        return extModule as T;
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
        return new Promise<void>(async (resolve, reject) => {
            const startTime = Date.now();

            try {
                const mainFilepath = this.getMainFilepath();

                if (!mainFilepath || !fs.existsSync(mainFilepath)) {
                    return reject(`Main file '${mainFilepath}' not found.`);
                }

                this.lib = require(mainFilepath);

                // Call the 'activate()' function
                if (typeof this.lib?.activate !== 'function') {
                    return reject("No activate() function was exported.");
                }

                // Call the function that registers the modules
                this.lib.activate();

                // Call the .activate() method on each module
                const promises: Promise<any>[] = [];
                _.forOwn(this.modules, (modules) => {
                    _.forOwn(modules, async module => {
                        if(!module.$module.methods.hasProvider('activate')) return;
                        
                        const timer = new Timer(); 
                        module.$module.isActivated = true;
                        const result = await module.$module.methods.callProvider('activate', []);
                        this.logger.debug(`Activated module ${module} in ${timer.end()}.`);

                        return result;
                    })
                })
                
                // // Wait until all modules are initialized
                await Promise.all(promises);
                this.logger.info(`Activating took ${Date.now()-startTime}ms.`);

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

    static parseModuleId(moduleId: string) {
        const split = moduleId.split('.');

        return [ split[0], split.slice(1).join('.') ];
    }
}

export default Extension;
