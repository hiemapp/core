import Device from '~/devices/Device';
import DeviceTrait from '../DeviceTrait';
import DeviceDisplay from '~/devices/DeviceDisplay';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';

export interface ISwitchTrait {
    commands: {
        toggleStatus: {
            status: boolean
        }
    },
    state: {
        status: boolean
    },
    options: DeviceTraitDefaultOptions<ISwitchTrait>
}

export class SwitchTrait extends DeviceTrait<ISwitchTrait> {
    protected init() {
        this.setConfig({
            menu: false
        })

        this.setDefaultOptions({
            sensor: false,
            primaryAction: {
                command: 'toggleStatus'
            }
        })

        this.setDisplayProvider((device, display) => {
            const status = this.getState(device).status;

            display.setActive(status);
            display.setText({
                message: `@hiem/core.devices.traits.switchTrait.status.${status ? 'on' : 'off'}.label`
            })
        })

        this.setCommandRegistry({
            toggleStatus: (device, params) => {             
                // If no state is passed, invert the current state
                if(!params.has('status')) {
                    const oldStatus = this.getState(device).status;
                    params.set('status', !oldStatus);
                }

                this.setState(device, { status: !!params.get('status') });
            },
        })
    }
}