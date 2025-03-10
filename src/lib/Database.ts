import * as _ from 'lodash';
import * as mysql from 'mysql2';
import knex, { Knex } from 'knex';
import { MongoClient } from 'mongodb';
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
    static client: MongoClient;

    static collection(table: string) {
        return Database.client.db().collection(table);
    }

    static async connect() {
        try {
            this.client = new MongoClient(process.env.MONGODB_URI!);
            
            logger.debug(`Connecting to database...`);
            await this.client.connect();
            logger.info(`Succesfully connected to database '${Database.client.db().databaseName}'.`);
        } catch (error) {
            logger.error('Failed to connect to database:', error);
            process.exit();
        }
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