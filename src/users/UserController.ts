import DatabaseController from '../lib/DatabaseController';
import User from '../users/User';
import { Config } from '../lib';
import * as _ from 'lodash';

export default class UserController extends DatabaseController<User>() {
    static table = 'users';

    static findDefaultUser() {
        return this.findBy(u => u.getProp('username') === null);
    }

    static async load() {
        await super.load(User);

        if(!this.findDefaultUser()) {
            await this.create({ 
                username: null,
                name: null,
                settings: {},
                permissions: {},
                password: null 
            });
        }
    }
}
