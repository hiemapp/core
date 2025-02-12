import _ from 'lodash';
import { User, UserController } from '~/users';

export type DeviceDisplayFormatterScale = 0.001 | 0.01 | 0.1 | 1 | 10 | 100 | 1000;
export type DeviceDisplayFormatterUnit = [DeviceDisplayFormatterScale, string];
export type DeviceDisplayFormatterUnits = DeviceDisplayFormatterUnit[];

export default class DeviceDisplayFormatters {
    protected user;

    constructor(user?: User) {
        this.user = user ?? UserController.findDefaultUser();
    }

    /** Format temperature (from °C). */
    temperature(temperature: number, precision: number) {
        return this.number(temperature, precision, '°C');
    }

    /** Format power (from W). */
    power(power: number, precision: number, scale: DeviceDisplayFormatterScale|null = null) {
        return this.numberScalable(power, precision, scale, [
            [1, 'W'],
            [1000, 'kW']
        ]);
    }
    
    /** Format energy (from Wh). */
    energy(energy: number, precision: number, scale: DeviceDisplayFormatterScale|null = null) {
        return this.numberScalable(energy, precision, scale, [
            [1, 'Wh'],
            [1000, 'kWh']
        ]);
    }

    /** Format volume (from m³). */
    volume(volume: number, precision: number) {
        return this.number(volume, precision, 'm<sup>3</sup>');
    }

    numberScalable(value: number, precision: number, scale: DeviceDisplayFormatterScale|null = null, units: DeviceDisplayFormatterUnits) {
        let [modifier, suffix] = this.getUnit(value, units, scale);
        value = value / modifier;
        return this.number(value, precision, suffix);
    }

    number(value: number, precision: number, suffix = '') {
        if(typeof value !== 'number' || isNaN(value)) return null;
        return value.toFixed(precision)+suffix;
    }

    /**
     * Get the most optimal unit for a number.
     * @param value The value to get the unit for.
     * @param units The list of units, from small to large.
     * @param scale The scale to use (optional)
     * @returns The most optiomal unit.
     * 
     * @example 
     * units = [[0.001, 'mm'], [0.01, 'cm'], [1, 'm'], [1000, 'km']]
     * getScale(2500, units)        // [1000, 'km'],
     * getScale(0.025, units)       // [0.01, 'cm'],
     * getScale(1200, units, 0.01)  // [0.01, 'cm'],
     * getScale(3000, units, 1)     // [1,    'm']
     * getScale(3000, units, 1000)  // [1000, 'km']
     */
    protected getUnit(value: number, units: DeviceDisplayFormatterUnits, scale: DeviceDisplayFormatterScale|null = null) {
        let unit: DeviceDisplayFormatterUnit|undefined = undefined;

        // If `scale` is set, find the corresponding unit
        if(typeof scale === 'number') {
            unit = units.find(u => Array.isArray(u) && u[0] === scale);
        }

        if(!Array.isArray(unit)) {
            for(const unit2 of units) {
                if(value >= unit2[0]) {
                    unit = unit2;
                } else {
                    break;
                }
            }
        }

        return unit ?? units[0];
    }
}