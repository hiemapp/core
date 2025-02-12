import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';
import _ from 'lodash';

export interface ITemperatureTrait {
    commands: {},
    state: {
        temperature: number;
    },
    options: DeviceTraitDefaultOptions<ITemperatureTrait>
}

export class TemperatureTrait extends DeviceTrait<ITemperatureTrait> {
    protected init() {
        this.setConfig({
            menu: true
        })

        this.setDefaultOptions({
            sensor: false,
            primaryAction: false
        })

        this.setDisplayProvider((device, display) => {
            const { temperature } = this.getState(device);
            const precision = device.getOption('precision', 1);

            display.setActive(true);
            display.addText({
                text: display.formatters.temperature(temperature, precision)
            })
        })
    }
}