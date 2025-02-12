import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';
import _ from 'lodash';

export interface IGasMeterTrait {
    commands: {},
    state: {
        gasConsumption: {
            present: number,
            total: number
        }
    },
    options: DeviceTraitDefaultOptions<IGasMeterTrait>
}

export class GasMeterTrait extends DeviceTrait<IGasMeterTrait> {
    protected init() {
        this.setConfig({
            menu: false
        })

        this.setDefaultOptions({
            sensor: true,
            primaryAction: false
        })

        this.setDisplayProvider((device, display) => {
            const { gasConsumption } = this.getState(device);
            const precision = device.getOption('precision', 1);

            display
                .setActive(gasConsumption.present > 0)
                .addText({
                    html: display.formatters.volume(gasConsumption.present, precision)
                })
        })
    }
}