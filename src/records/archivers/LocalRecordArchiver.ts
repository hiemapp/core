import RecordManager from '~/records/RecordManager';
import path from 'path';
import { dirs } from '~/utils';
import fs from 'fs/promises';
import dayjs from 'dayjs';
import { glob } from 'glob';
import RecordArchiver from '~/records/archivers/RecordArchiver';
import ImmutableRecord from '../ImmutableRecord';
import RecordParser from '../parsers/RecordParser';

export default class LocalRecordArchiver extends RecordArchiver {
    FILE_DIR = 'records';

    protected baseDir: string;
    
    protected async init() {
        this.baseDir = path.resolve(dirs().STORAGE, 'devices', this.manager.device.id.toString(), 'recording')
    
        await fs.mkdir(this._resolvePath(`./${this.FILE_DIR}`), { recursive: true });
    }

    load(parser: RecordParser, date: Date) {
        return new Promise<Buffer|false>((resolve, reject) => {
            const filepath = this._getFilepath(parser, date);

            fs.readFile(filepath).then(content => resolve(content)).catch(err => {
                if(err.code === 'ENOENT') return resolve(false);

                reject(err);
            })
        })
    }

    async save(parser: RecordParser, date: Date, content: string|Buffer) {
        const filepath = this._getFilepath(parser, date);
        await fs.writeFile(filepath, content);
    }
    
    async getIndex(): Promise<Date[]> {
        const files = await glob('*.*', { cwd: this._resolvePath(`./${this.FILE_DIR}`) });
        return files.map(file => new Date(path.parse(file).name));
    }
    
    protected _getFilepath( parser: RecordParser, date: number | Date | string) {
        const filename = dayjs(date).format('YYYY-MM-DD');
        return this._resolvePath(`./${this.FILE_DIR}`, `${filename}.${parser.PARSER_ID}`);
    }

    protected _resolvePath(...paths: string[]) {
        return path.resolve(this.baseDir, ...paths);
    }
}