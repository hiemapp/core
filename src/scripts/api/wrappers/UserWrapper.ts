import type { User as IUser } from '~types/scripts/ScriptApi';
import type { UserType } from '~/Users/User.types';
import type User from '~/Users/User';
import ModelWrapper from './ModelWrapper';

export default class UserWrapper extends ModelWrapper<User, UserType> implements IUser {
    getName() { return this.model.getProp('name'); }
    getIcon() { return this.model.getProp('icon'); }
    
    getState() { return this.model.getDynamicProp('state'); }
    performInput(name: string, value: any) { return this.model.performInput(name, value) };
    async getSensorData() { 
        if(!this.model.connection || !this.model.connection.isReady()) return null;
        return await this.model.connection.read();
    };
}