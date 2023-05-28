import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import UserController from './UserController';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { getDir } from '~/utils/paths';

export interface UserProps {
    id: number;
    name: string;
    permissions: Record<string, boolean>;
    settings: Record<string, any>,
    password: string | null;
}

export interface SerializedUserProps extends UserProps {}

export default class User extends ModelWithProps<UserProps, SerializedUserProps> {
    _getConfig(): ModelWithPropsConfig<UserProps, SerializedUserProps> {
        return {
            controller: UserController,
            defaults: {
                name: 'UNNAMED',
                permissions: {},
                settings: {},
                password: null
            }
        }
    }

    hasPermission(key: string) {
        const permissions = this.getProp('permissions');

        if (!permissions || !_.isPlainObject(permissions)) return false;

        if (typeof permissions[key] === 'boolean') return permissions[key] === true;

        const parts = key.split('.');
        for (let i = parts.length; i >= 0; i--) {
            const permissionWithWildcard = _.trimStart(parts.slice(0, i).join('.') + '.*', '.');

            if (permissions[permissionWithWildcard] != undefined) return permissions[permissionWithWildcard] === true;
        }

        return false;
    }

    getSetting(key: string) {
        return _.get(this.getProps(), `settings.${key}`);
    }

    getPicturePath() {
        const filepath = path.join(getDir('STATIC'), 'users', 'pictures', this._id + '.jpg');
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
                return reject(`${this} has no password set.`);
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
