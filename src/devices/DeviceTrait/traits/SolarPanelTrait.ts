import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';
import _ from 'lodash';

export interface ISolarPanelTrait {
    commands: {},
    state: {
        energy: {
            today: number;
            total: number;
        }
    },
    options: DeviceTraitDefaultOptions<ISolarPanelTrait> & {
        display?: { 
            /** The scale of the display values (use 1 for Watts, or 1000 for kilowatts). When set to null, a scale is determined automatically. */
            scale?: 1 | 1000 | null 
        }
    }
}

export class SolarPanelTrait extends DeviceTrait<ISolarPanelTrait> {
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
            const { energy } = this.getState(device);
            const precision = device.getOption('display.precision', 1);

            const displayScale = this.getOption('display.scale');

            display.setActive(energy.today > 0);
            display.addText({
                text: display.formatters.energy(energy.today, precision, displayScale) + ' today'
            })
        })
    }
}