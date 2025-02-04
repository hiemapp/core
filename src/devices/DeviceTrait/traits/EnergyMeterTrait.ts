import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';
import _ from 'lodash';

export interface IEnergyMeterTrait {
    commands: {},
    state: {
        powerConsumption: {
            present: number,
            total: number
        },
        powerReturn: {
            present: number,
            total: number
        },
        gasConsumption: {
            present: number,
            total: number
        }
    },
    options: DeviceTraitDefaultOptions<IEnergyMeterTrait>
}

export class EnergyMeterTrait extends DeviceTrait<IEnergyMeterTrait> {
    protected init() {
        this.setConfig({
            menu: false
        })

        this.setDefaultOptions({
            sensor: true,
            primaryAction: false
        })

        this.setDisplayProvider((device, display) => {
            const { powerConsumption, gasConsumption } = this.getState(device);
            const precision = device.getOption('precision', 1);

            display.setActive(true);
            display.addText({
                text: display.formatters.power(powerConsumption?.present, precision)
            })
        })
    }
}