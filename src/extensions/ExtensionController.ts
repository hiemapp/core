import { globSync } from 'glob';
import Controller from '../lib/Controller';
import * as path from 'path';
import * as _ from 'lodash';
import { getDir } from '~/utils/paths';
import Extension from '../extensions/Extension';
import ExtensionNotInstalledError from '../errors/ExtensionNotInstalledError';
import Manifest from '../utils/Manifest';
import { type ExtensionModuleClass } from './ExtensionModule';

export default class ExtensionController extends Controller<Extension>() {
    /**
     * Gets a list of all enabled extensions.
     */
    static load() {
        return new Promise<void>(async (resolve, reject) => {
            const manifestFilepaths = globSync('*/package.json', { 
                cwd: getDir('EXTENSIONS'),
                absolute: true 
            });

            let data: Record<string, Extension> = {};

            for (const filepath of manifestFilepaths) {
                const manifest = await Manifest.fromFile(filepath);

                const extension = new Extension(manifest, path.dirname(filepath));

                data[extension.getId()] = extension;
            }

            // Store the extensions.
            super.store(data);

            // Activate the extensions.
            this.index().forEach((extension: Extension) => extension.activate());

            // Resolve. At this point the extensions are
            // not yet activated, but they will be soon.
            return resolve();
        });
    }
    
    /**
     * Find an extension by name.
     * @param name - The name of the extension to find.
     */
    static find(name: string): Extension {
        const extension = super.find(name);

        if (extension instanceof Extension) return extension;

        throw new ExtensionNotInstalledError(name);
    }

    static findAllModulesOfType<T extends ExtensionModuleClass>(typeClass: T) {
        let foundModules: Record<string, T> = {};

        this.index().forEach(extension => {
            if (!extension.modules || !extension.modules[typeClass.name]) return true;

            _.forOwn(extension.modules[typeClass.name], (module, name) => {
                const moduleSlug = `${extension.getId()}.${name}`;
                foundModules[moduleSlug] = module;
            });
        });

        return foundModules;
    }

    static findModule<T extends ExtensionModuleClass>(moduleType: T, moduleSlug: string) {
        const [ extensionId, moduleName ] = Extension.parseModuleSlug(moduleSlug);
        const ext = this.find(extensionId);
        return ext.getModule(moduleType, moduleName);
    }

    static findModuleOrFail<T extends ExtensionModuleClass>(moduleType: T, moduleSlug: string) {
        const [ extensionId, moduleName ] = Extension.parseModuleSlug(moduleSlug);
        const ext = this.find(extensionId);
        return ext.getModuleOrFail(moduleType, moduleName);
    }

    // /**
    //  * Create and store a list of extensions.
    //  * @returns {ExtensionController}
    //  */
    // static _populate() {
    //     // Get a list of extension ids
    //     const extensionIds = globSync('*/manifest.json', { cwd: EXTENSIONS_DIR })
    //         .map(manifestFilepath => path.dirname(manifestFilepath));

    //     return Object.fromEntries(extensionIds.map(extensionId => {
    //         const manifestLock = this.generateManifestLock(extensionId);
    //         return [ extensionId, manifestLock]
    //     }));
    // }

    // /**
    //  * Reads the manifest file of an extension.
    //  * @param {string} extensionId The id of the extension to read the manifest file of.
    //  * @returns {object} The contents of the manifest file.
    //  */
    // static readManifest(extensionId) {
    //     const filepath = path.join(this.getDir(extensionId), 'manifest.json');
    //     return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    // }

    // /**
    //  * Reads the manifest lockfile of an extension.
    //  * @param {string} extensionId The id of the extension to read the manifest lockfile of.
    //  * @returns {object} The contents of the manifest lockfile.
    //  */
    // static readManifestLock(extensionId) {
    //     const filepath = path.join(this.getDir(extensionId), 'manifest-lock.json');
    //     return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    // }

    // /**
    //  * Generates a manifest lockfile for an extension.
    //  * @param {string} extensionId The id of the extension to generate the manifest lockfile for.
    //  * @param {number} lockfileVersion The version of the lockfile to generate.
    //  * @returns {object} The contents of the manifest lockfile.
    //  */
    // static generateManifestLock(extensionId, lockfileVersion = 1) {
    //     // Path to store the manifest lock file at
    //     const filepath = path.join(this.getDir(extensionId), 'manifest-lock.json');

    //     // Pattern for getting a list of modules
    //     const pattern = `**/*.{${this.FileExtensionsWhiteList.join(',')}}`;

    //     // Get a list of modules
    //     const modules = globSync(pattern, { cwd: this.getModulesDir(extensionId) });

    //     // Contents of the manifest
    //     const manifest = this.readManifest(extensionId);

    //     // Variable for storing the data to write to the manifest lockfile
    //     let data = { lockfileVersion: lockfileVersion };

    //     switch(lockfileVersion) {
    //         case 1:
    //             data = _.pick(manifest, 'name', 'author');
    //             data.modules = {};

    //             modules.forEach(filepath => {
    //                 const parsed = path.parse(filepath);

    //                 // Files and directories can be disabled by prepending them with a `_`.
    //                 // Disabled files should not be included in the manifest lock file.
    //                 const isDisabled = (parsed.name.startsWith('_') || /\\_|\/_/gm.test(parsed.dir));
    //                 if(isDisabled) return true;

    //                 // Filename with directories appended, but without extension
    //                 const nameWithDirs = path.join(parsed.dir, parsed.name).replace(/[\\\/]+/gm, '/');

    //                 // The keypath for in the manifest-lock.json file
    //                 // (removing any _) from the start of the file.
    //                 const keypath = _.trimStart(nameWithDirs, '_').replaceAll('/', '.modules.');

    //                 _.set(data.modules, keypath, {
    //                     path: path.join(this.getModulesDir(extensionId), filepath),
    //                     type: _.trimStart(parsed.ext, '.'),
    //                     name: nameWithDirs
    //                 });
    //             })

    //             break;
    //         default:
    //             throw new Error(`Unknown manifest lockfile version: '${lockfileVersion}'.`)
    //     }

    //     fs.writeFileSync(filepath, JSON.stringify(data), 'utf8');

    //     return data;
    // }

    // /**
    //  * Finds the root directory for an extension.
    //  * @param {string} extensionId The id of the extension to find the root directory for.
    //  * @returns {string} The root directory path of the extension.
    //  */
    // static getDir(extensionId) {
    //     return path.join(EXTENSIONS_DIR, extensionId);
    // }

    // /**
    //  * Finds the modules/ directory for an extension
    //  * @param {string} extensionId The id of the extension to find the modules/ directory for.
    //  * @returns {string} The modules/ directory path of the extension
    //  */
    // static getModulesDir(extensionId) {
    //     return path.join(this.getDir(extensionId), 'modules'); }
}
