import { dirs } from '~/utils/paths';
import path from 'path';
import StackTrace from 'stacktrace-js';
import ExtensionController from '../extensions/ExtensionController';
import fs from 'fs';
import ExtensionModule from './ExtensionModule';
import { Constructor } from '~types/helpers';

export function resolveExtensionModuleType(extModule: ExtensionModule) {
    let typeClass: Constructor<ExtensionModule> = extModule.constructor as any;

    while(Object.getPrototypeOf(typeClass) !== ExtensionModule) {
        typeClass = Object.getPrototypeOf(typeClass)
    }

    return typeClass;
}

export function resolveExtensionFromStack() {
    const stack = getStack();
    const rootDir = path.join(dirs().EXTENSIONS, path.relative(dirs().EXTENSIONS, stack.fileName).split(path.sep)[0]);
    const packageFilepath = path.resolve(rootDir, './package.json');

    let extensionId = path.basename(rootDir);
    try {
        const packageData = JSON.parse(fs.readFileSync(packageFilepath, 'utf8'));
        if(typeof packageData?.name === 'string') {
            extensionId = packageData.name;
        }
    } catch(err) {}

    const extension = ExtensionController.find(extensionId);

    return extension;
}

export function getStack(): any {
    const trace = StackTrace.getSync();

    const stack = trace.find((stack) => {
        if(typeof stack.fileName !== 'string') return false;

        // Ensure correct capitalization
        const normalizedFilename = fs.realpathSync.native(stack.fileName);

        // Check if the stack filename is inside the extension directory
        return normalizedFilename.startsWith(dirs().EXTENSIONS)
    });
    if (!stack) throw new Error('Failed to get extension call stack.');

    return stack;
}
