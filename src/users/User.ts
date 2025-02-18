import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import ModelWithProps from '../lib/ModelWithProps';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { dirs } from '~/utils/paths';
import Model from '~/lib/Model';
import type { UserPermissionAction, UserType } from './User.types';
import { minimatch } from 'minimatch';
import z from 'zod';

export default class User extends ModelWithProps<UserType> {
    protected $schema = z.object({
        id: z.number(),
        username: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        permissions: z.record(z.string(), z.boolean()).default({
            'device.*.view': true
        }),
        settings: z.record(z.string(), z.any()),
        password: z.string().nullable()
    })

    hasPermission<TModel extends Model<any>>(resource: TModel, action: UserPermissionAction): boolean;
    hasPermission(key: string): boolean;
    hasPermission(...args: any[]) {
        let key: string;

        if (typeof args[0] === 'string') {
            key = args[0];
        } else if (args[0] instanceof Model) {
            const resource = args[0];
            const action = args[1];
            key = `${resource.constructor.name.toLowerCase()}.${resource.id}.${action}`;
        } else {
            return false;
        }
        const permissions = this.getProp('permissions');
        if (typeof permissions[key] === 'boolean') return permissions[key] === true;

        for(const selector in permissions) {
            if(!minimatch(key, selector)) continue;
            return permissions[selector];
        }

        return false;
    }

    getName() {
        return this.getProp('name');
    }

    getUsername() {
        return this.getProp('username');
    }

    getSetting(key: string) {
        return _.get(this.getProps(), `settings.${key}`);
    }

    getPicturePath() {
        const filepath = path.resolve(dirs().STATIC, 'users', 'pictures', this.$id + '.jpg');
        if (!fs.existsSync(filepath)) return null;

        return filepath;
    }

    async updatePassword(newPassword: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const salt = randomBytes(16).toString('hex');
            scrypt(newPassword, salt, 64, (err, buf) => {
                if (err) return reject(err);

                const hash = `${buf.toString('hex')}.${salt}`;

                this.setProp('password', hash);

                return resolve();
            });
        });
    }

    verifyPasswordTimeSafe(password: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const hash = this.getProp('password');

            if (typeof hash !== 'string') {
                return reject('noPasswordSet');
            }

            const [hashedPassword, salt] = hash.split('.');
            const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');

            scrypt(password, salt, 64, (err, passwordBuf) => {
                if (err) return reject(err);

                const isEqual = timingSafeEqual(hashedPasswordBuf, passwordBuf);
                return resolve(isEqual);
            });
        });
    }
}
