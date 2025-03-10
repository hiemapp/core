import Device from '~/devices/Device';
import DeviceTrait from '../DeviceTrait';
import DeviceDisplay from '~/devices/DeviceDisplay';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';

export interface IPresenceTrait {
    commands: {
        togglePresence: {
            isPresent: boolean
        }
    },
    state: {
        isPresent: boolean
    },
    options: DeviceTraitDefaultOptions<IPresenceTrait>
}

export class PresenceTrait extends DeviceTrait<IPresenceTrait> {
    protected init() {
        this.setConfig({
            menu: false
        })

        this.setDefaultOptions({
            sensor: false,
            primaryAction: {
                command: 'togglePresence'
            }
        })

        this.setDisplayProvider((device, display) => {
            const isPresent = this.getState(device).isPresent;

            display.setActive(isPresent);
            display.setText({
                message: `@hiem/core.devices.traits.presenceTrait.${isPresent ? 'present' : 'absent'}.label`
            })
        })

        this.setCommandRegistry({
            togglePresence: (device, params) => {             
                // If no state is passed, invert the current state
                if(!params.has('isPresent')) {
                    const oldStatus = this.getState(device).isPresent;
                    params.set('isPresent', !oldStatus);
                }

                this.setState(device, { isPresent: !!params.get('isPresent') });
            },
        })
    }
}