
import type Extension from '../Extension';
import { Constructor } from '~types/helpers';
import ExtensionModule from '../ExtensionModule';
import { resolveExtensionFromStack, resolveTypeClass } from '../utils';
import _ from 'lodash';

export function registerModule<T extends ExtensionModule>(
    name: string,
    callback: ((extension: Extension) => Constructor<T> | null),
    validate?: (prototype: T, moduleClass: Constructor<T>) => boolean | string | Error | void,
) {
    const extension = resolveExtensionFromStack();

    try {
        let moduleClass = callback(extension);

        if (!(moduleClass?.prototype instanceof ExtensionModule)) {
            throw new Error(`Must extend ${ExtensionModule.name}, received ${module}.`);
        }

        // Resolve the type of module (i.e. FlowBlock, DeviceDriver)
        var typeClass = resolveTypeClass(moduleClass);

        if (typeof validate === 'function') {
            const result = validate(moduleClass.prototype as T, moduleClass);
            if(result !== true && typeof result !== 'undefined') {
                throw result;
            }
        }

        extension.registerModule(name, moduleClass, typeClass);
    } catch(err: any) {
        extension.logger.error(`Error registering '${name}':`, { err });
    }

}
