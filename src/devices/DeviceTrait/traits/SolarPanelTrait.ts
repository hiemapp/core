import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';
import _ from 'lodash';

export interface ISolarPanelTrait {
    commands: {},
    state: {
        energy: number;
    },
    options: DeviceTraitDefaultOptions<ISolarPanelTrait>
}

export class SolarPanelTrait extends DeviceTrait<ISolarPanelTrait> {
    protected init() {
        this.setConfig({
            menu: false
        })

        this.setDefaultOptions({
            sensor: true,
            primaryAction: false
        })

        this.setDisplayProvider((device, display) => {
            const { energy } = this.getState(device);
            const precision = device.getOption('precision', 1);

            display.setActive(true);
            display.addText({
                text: display.formatters.solarEnergy(energy, precision)
            })
        })
    }
}