import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';

export interface IHumidityTrait {
    commands: {},
    state: {
        humidity: number;
    },
    options: DeviceTraitDefaultOptions<IHumidityTrait>
}

export class HumidityTrait extends DeviceTrait<IHumidityTrait> {
    protected init() {
        this.setConfig({
            menu: true
        })

        this.setDefaultOptions({
            sensor: false,
            primaryAction: false
        })

        this.setDisplayProvider((device, display) => {
            const { humidity } = this.getState(device);

            display.addText({
                text: Math.round(humidity)+'%'
            });
        })
    }
}