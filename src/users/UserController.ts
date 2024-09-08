import ControllerDatabase from '../lib/ControllerDatabase';
import User from '../users/User';
import { Config } from '../lib';
import * as _ from 'lodash';

export default class UserController extends ControllerDatabase<User>() {
    static table = 'users';
    protected static DEFAULT_USER_USERNAME: string;

    static findDefaultUser() {
        return this.findBy(u => u.getProp('username') === this.DEFAULT_USER_USERNAME);
    }

    static async load() {
        this.DEFAULT_USER_USERNAME = Config.get('system.users.defaultUser');

        let defaultUserRow: any;
        super.load(User, (row, rows) => {
            if(!defaultUserRow) {
                defaultUserRow = rows.find((row) => row.username === this.DEFAULT_USER_USERNAME);
            }

            return new User(row.id, _.defaultsDeep(row, defaultUserRow ?? {}));
        });
    }
}
