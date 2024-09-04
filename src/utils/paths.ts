import path from 'path';
import fs from 'fs';
import Config from '../lib/Config';

const RELATIVE_DIRECTORIES = {
    STORAGE: './storage',
    CONFIG: './config',
    EXTENSIONS: './storage/extensions',
    STATIC: './storage/static',
    LOG: './storage/log',
    PUBLIC: './public'
}

let _dirs: Record<keyof typeof RELATIVE_DIRECTORIES, string>;

export const dirs = ()  => {
    if(!_dirs) {
        _dirs = {
            STORAGE: resolveDir('./storage'),
            CONFIG: resolveDir('./config'),
            EXTENSIONS: resolveDir('./storage/extensions'),
            STATIC: resolveDir('./storage/static'),
            LOG: resolveDir('./storage/log'),
            PUBLIC: resolveDir('./public')
        }
    }

    return _dirs;
}

export function resolveDir(...dirs: string[]) {
    return fs.realpathSync.native(path.resolve(Config.getRootDir(), ...dirs));
}

