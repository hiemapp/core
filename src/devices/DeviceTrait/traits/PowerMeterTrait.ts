import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';
import _ from 'lodash';

export interface IPowerMeterTrait {
    commands: {},
    state: {
        powerConsumption: {
            present: number,
            total: number
        },
        powerReturn: {
            present: number,
            total: number
        }
    },
    options: DeviceTraitDefaultOptions<IPowerMeterTrait> & {
        display?: {
            /** The scale of the display values (use 1 for Watts, or 1000 for kilowatts). When set to null, a scale is determined automatically. */
            scale?: 1 | 1000 | null
        }
    }
}

export class PowerMeterTrait extends DeviceTrait<IPowerMeterTrait> {
    protected init() {
        this.setConfig({
            menu: false
        })

        this.setDefaultOptions({
            sensor: true,
            primaryAction: false,
            display: {
                scale: null
            }
        })

        this.setDisplayProvider((device, display) => {
            const { powerConsumption, powerReturn } = this.getState(device);
            const precision = device.getOption('precision', 2);

            const displayScale = this.getOption('display.scale');

            display
                .setActive(powerConsumption.present > 0 || powerReturn.present > 0)
                .addText({
                    html: display.formatters.power(powerConsumption.present, precision, displayScale)
                })
                .addText({
                    html: display.formatters.power(powerReturn.present, precision, displayScale)
                })
        })
    }
}