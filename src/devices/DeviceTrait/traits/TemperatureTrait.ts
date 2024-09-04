import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';

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
            passive: false,
            primaryAction: false
        })

        this.setDisplayProvider((device, display) => {
            const { temperature } = this.getState(device);

            display.setText({
                text: temperature+'*C'
            })
        })
    }
}