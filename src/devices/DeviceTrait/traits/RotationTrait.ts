import Device from '~/devices/Device';
import DeviceTrait from '../DeviceTrait';
import DeviceDisplay from '~/devices/DeviceDisplay';
import { DeviceCommandExecutionError, DeviceInvalidParamError } from '~/errors';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';

export interface IRotationTrait {
    commands: {
        setAngle: {
            angle: number
        }
    },
    state: {
        angle: number,
        isActive: boolean
    },
    options: DeviceTraitDefaultOptions<IRotationTrait> & {
        dimensions: {
            type: 'yaw'|'pitch'|'roll',
            min?: number,
            max?: number
        }[]
    }
}

export class RotationTrait extends DeviceTrait<IRotationTrait> {
    protected init() {
        this.setConfig({
            menu: false
        })

        this.setDefaultOptions({
            dimensions: [
                {
                    type: 'yaw',
                    min: 0,
                    max: 360
                },
                {
                    type: 'pitch',
                    min: 0,
                    max: 360
                },
                {
                    type: 'roll',
                    min: 0,
                    max: 360
                }
            ],
            passive: false,
            primaryAction: false
        })

        this.setDisplayProvider((device, display) => {
            const isActive = !!this.getState(device).isActive;
            display.setActive(isActive);
        })

        this.setCommandRegistry({
            setAngle: (device, params) => {
                const angle = params.get('angle'); 

                return this.setState(device, {
                    angle: params.get('angle')
                })
            },
        })
    }
    setActive(device: Device, isActive = true) {
        device.setMetadata('traits.rotation.isActive', isActive);
    }
}