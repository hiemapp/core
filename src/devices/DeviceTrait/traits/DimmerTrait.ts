import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';

export interface IDimmerTrait {
    commands: {
        setBrightness: {
            brightness: number;
        }
    },
    state: {
        brightness: number;
    },
    options: DeviceTraitDefaultOptions<IDimmerTrait> & {
        min?: number;
        max?: number;
    }
}

export class DimmerTrait extends DeviceTrait<IDimmerTrait> {
    protected init() {
        this.setConfig({
            menu: true
        })

        this.setDefaultOptions({
            min: 0,
            max: 100,
            primaryAction: false,
            sensor: false
        })

        this.setCommandRegistry({
            setBrightness: (device, params) => {
                this.setState(device, { 
                    brightness: params.get('brightness')
                })
            }
        })
    }
}