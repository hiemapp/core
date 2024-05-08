
import type Extension from '../Extension';
import { Constructor } from '~types/helpers';
import { ExtensionModuleClass } from '../ExtensionModule';
import { resolveExtensionFromStack, resolveTypeClass } from '../utils';
import _ from 'lodash';
import { FlowBlock } from './flows';

export function registerModule<T extends ExtensionModuleClass>(
    name: string,
    callback: ((extension: Extension) => T | null),
    validate?: (prototype: InstanceType<T>, moduleClass: T) => boolean | string | Error | void,
) {
    const extension = resolveExtensionFromStack();
    let typeClass;

    try {
        const moduleClass = callback(extension);

        if (!(moduleClass?.isExtensionModule)) {
            throw new Error(`${module} is not an ExtensionModule.`);
        }

        // Resolve the type of module (i.e. FlowBlock, DeviceDriver)
        typeClass = resolveTypeClass(moduleClass);
        if(!typeClass) {
            throw new Error('Failed to resolve typeclass.');
        }

        if (typeof validate === 'function') {
            const result = validate(moduleClass.prototype as any, moduleClass);
            if(result !== true && typeof result !== 'undefined') {
                throw result;
            }
        }
        
        if(typeof moduleClass.init === 'function') {
            moduleClass.init();
            moduleClass.validate();
        }

        extension.registerModule(name, moduleClass, typeClass);
    } catch(err: any) {
        extension.logger.error(`Error registering ${typeClass ? `${typeClass.name} ` : ''}'${name}':`, err);
    }
}
