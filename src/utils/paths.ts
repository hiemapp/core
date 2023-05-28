import path from 'path';
import fs from 'fs';
import Config from '../lib/Config';

const relativeDirectories = {
    STORAGE: './storage',
    CONFIG: './config',
    EXTENSIONS: './storage/extensions',
    STATIC: './storage/static',
    LOG: './storage/log'
} as const;

export function getDir(dir: keyof typeof relativeDirectories) {
    return path.resolve(Config.getRootDir(), relativeDirectories[dir]);
}

