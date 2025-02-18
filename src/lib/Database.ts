import * as _ from 'lodash';
import * as mysql from 'mysql2';
import knex, { Knex } from 'knex';
import { logger } from './Logger';

export interface DatabaseCredentials {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
}

export interface IDatabaseFields {
    [key: string]: any
}

class Database {
    static knex: Knex;
    static connection: mysql.Connection;

    protected static getCredentials(): DatabaseCredentials {
        const fields: Record<keyof DatabaseCredentials, string> = {
            'host': 'DATABASE_HOST',
            'user': 'DATABASE_USER',
            'password': 'DATABASE_PASSWORD',
            'database': 'DATABASE_DATABASE',
            'port': 'DATABASE_PORT'
        }

        return _.mapValues(fields, (envKey, key) => {
            const value = process.env[envKey];

            if(typeof value !== 'string') {
                if(key === 'port') return;
                throw new Error(`Invalid value for environment variable ${envKey}: ${value}.`);
            }

            return key === 'port' ? parseInt(value) : value;
        }) as DatabaseCredentials;
    }

    static connect() {
        const { host, user, password, database } = this.getCredentials();

        logger.debug(`Connecting to database '${process.env.DATABASE_DATABASE}' as user '${process.env.DATABASE_USER}'...`);


        this.knex = knex({
            client: 'mysql2',
            connection: {
                host: process.env.DATABASE_HOST,
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_DATABASE,
                port: typeof process.env.DATABASE_PORT === 'number' ? parseInt(process.env.DATABASE_PORT) : undefined,
                timezone: 'Z'
            }
        })
    }

    static async query(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.connection.execute(sql, params, (err, rows: any[]) => {
                if (err) return reject(err);

                if (!_.isArray(rows))
                    return resolve([]);

                // Decode JSON fields
                rows = rows.map(row => _.mapValues(row, value => {
                    try {
                        return JSON.parse(value);
                    } catch (err) {
                        return value;
                    }
                }))

                return resolve(rows);
            })
        })
    }

    static serializeFields(fields: IDatabaseFields): string {
        const encodedFields = _.mapValues(fields, (v, k) => {
            if (v instanceof Date) {
                return v.toISOString().slice(0, 19).replace('T', ' ');
            }

            if (v !== null && (Array.isArray(v) || _.isPlainObject(v))) {
                return JSON.stringify(v);
            }

            return v;
        });

        return this.connection.escape(encodedFields);
    }

    static escapeSQLWord(word: string) {
        return word.replace(/[^a-zA-Z0-9_$-]+/g, '');
    }
}

export default Database;