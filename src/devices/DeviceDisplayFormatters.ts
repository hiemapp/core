import _ from 'lodash';
import { User, UserController } from '~/users';

export default class DeviceDisplayFormatters {
    protected user;

    constructor(user?: User) {
        this.user = user ?? UserController.findDefaultUser();
    }

    temperature(temperature: number, precision: number) {
        return this.number(temperature, precision, '°C');
    }

    power(power: number, precision: number) {
        return this.number(power, precision, 'kW');
    }

    solarEnergy(energy: number, precision: number) {
        return this.number(energy, precision, 'kWh');
    }
    number(number: number, precision: number, suffix = '') {
        if(typeof number !== 'number') return null;
        return _.round(number, precision)+suffix;
    }
}