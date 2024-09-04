import { palettes } from '~/ui/constants/style';
import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';
import { icons } from '~/ui/constants/icons';
import { HumidityTrait } from './HumidityTrait';

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

            display.addText({
                text: Math.round(temperature)+'°C'
            })
        })
    }
}