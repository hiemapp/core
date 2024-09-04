import { globSync } from 'glob';
import Controller from '../lib/Controller';
import * as path from 'path';
import * as _ from 'lodash';
import { dirs } from '~/utils/paths';
import Extension from '../extensions/Extension';
import ExtensionNotInstalledError from '../errors/ExtensionNotInstalledError';
import Manifest from '../utils/Manifest';
import type ExtensionModule from './ExtensionModule';
import { Constructor } from '~types/helpers';

export default class ExtensionController extends Controller<Extension>() {
    /**
     * Gets a list of all enabled extensions.
     */
    static load() {
        return new Promise<void>(async (resolve, reject) => {
            const manifestFilepaths = globSync('*/package.json', { 
                cwd: dirs().EXTENSIONS,
                absolute: true 
            });

            let data: Record<string, Extension> = {};

            for (const filepath of manifestFilepaths) {
                const manifest = await Manifest.fromFile(filepath);

                const extension = new Extension(manifest, path.dirname(filepath));

                data[extension.id] = extension;
            }

            // Store the extensions.
            super.store(data);

            // Activate all the extensions.
            await Promise.all(this.index().map(async ext => {
                return await ext.activate().catch(err => {
                    ext.logger.error('Activation error:', err);
                })
            }));

            // Resolve.
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

    static findAllModulesOfType<T extends ExtensionModule>(type: Constructor<T>) {
        const modules: T[] = [];

        this.index().forEach(extension => {
            if (!extension.modules || !extension.modules[type.name]) return true;

            _.forOwn(extension.modules[type.name], module => {
                modules.push(module as T);
            });
        });

        return modules;
    }

    static findModule<T extends ExtensionModule>(type: Constructor<T>, id: string) {
        const [ extensionId, moduleName ] = Extension.parseModuleId(id);
        const ext = this.find(extensionId);
        return ext.getModule(type, moduleName);
    }

    static findModuleOrFail<T extends ExtensionModule>(type: Constructor<T>, id: string) {
        const [ extensionId, moduleName ] = Extension.parseModuleId(id);
        try {
            const ext = this.find(extensionId);
            return ext.getModuleOrFail(type, moduleName);
        } catch(err) {
            return null;
        }
    }
}
