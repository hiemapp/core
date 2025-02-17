import ImmutableRecord from '~/records/ImmutableRecord';
import RecordParser from '~/records/parsers/RecordParser';
import radix64 from '~/utils/radix64';
import _ from 'lodash';
import { stringify as stringifyCsv } from 'csv-stringify';
import { parse as parseCsv } from 'csv-parse';
import { DeviceDriverManifestRecordingField } from '~/devices';

export default class CsvRecordParser extends RecordParser {
    PARSER_ID = 'csv';

    protected CELL_DELIMITER = ';';

    protected fieldAliases: Array<DeviceDriverManifestRecordingField & { alias: string }> = [];

    async init() {
        this.manager.fields.forEach(field => {
            if(typeof field.id !== 'number') return;
            this.fieldAliases.push({ ...field, alias: String.fromCharCode(field.id + 65) })
        })
    }

    async decompress(buffer: Buffer) {
        return new Promise<ImmutableRecord[]>((resolve, reject) => {
            const records: ImmutableRecord[] = [];

            parseCsv(buffer, { delimiter: this.CELL_DELIMITER }, (err, lines: string[][]) => {
                if(err) return reject(err);

                lines.forEach(cells => {
                    const date = new Date(radix64.decodeToInt(cells[0])*1000);
                    const values: Record<string, number> = {};
                    cells.slice(1).forEach(cell => {
                        const alias = cell.slice(0, 1);
                        const value = parseFloat(cell.slice(1));

                        const name = this._getFieldName(alias);
                        if(!name) return;

                        values[name] = value;
                    })

                    records.push(new ImmutableRecord(date, values))
                })

                resolve(records);
            })  
        })
    }

    /** @deprecated */
    compress(records: ImmutableRecord[]) {
        return new Promise<Buffer>((resolve, reject) => {
            const lines = records.map(record => {
                let cells: string[] = [];

                // For storing the date as a base64url string
                cells[0] = radix64.encodeInt(Math.round(record.getTime()/1000));

                _.forOwn(record.getValues(), (value, name) => {
                    // Aliases are used to minimize the amount of disk space used
                    const alias = this._getFieldAlias(name);
                    if(typeof alias !== 'string') {
                        this.manager.device.logger.error(`Alias for field '${name}' not found.`);
                        return;
                    }

                    cells.push(`${alias}${value}`);
                });

                return cells;
            })

            stringifyCsv(lines, { delimiter: this.CELL_DELIMITER }, (err, output) => {
                if(err) return reject(err);
                
                const buffer = Buffer.from(output, 'utf8');
                resolve(buffer);
            })
        })
    }

    protected _getFieldName(alias: string) {
        return this.fieldAliases.find(f => f.alias === alias)?.name ?? null;
    }

    protected _getFieldAlias(name: string) {
        return this.fieldAliases.find(f => f.name === name)?.alias ?? null;
    }

    async saveFile(date: Date) {
        return '';
    }
}