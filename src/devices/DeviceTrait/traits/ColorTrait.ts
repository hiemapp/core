import Device from '~/devices/Device';
import DeviceTrait from '../DeviceTrait';
import { SwitchTrait } from './SwitchTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';

export interface IColorTrait {
    commands: {
        setColor: {
            color: string;
        },
        setProgram: {
            program: string;
        }
    },
    state: {
        color: string|null,
        program: string|null
    },
    options: DeviceTraitDefaultOptions<IColorTrait> & {
        colors?: string[];
        programs?: Array<{ icon: string, id: string }>;
        preview: {
            enabled?: boolean;
            throttle?: number;
        }
    }
}

export class ColorTrait extends DeviceTrait<IColorTrait> {
    protected init() {
        this.setConfig({
            menu: true
        })

        this.setDefaultOptions({
            primaryAction: false,
            sensor: false,
            preview: {
                enabled: false,
                throttle: 500
            },
            colors: [
                '#FFA148', // 2500K
                '#FFB46B', // 3000K
                '#FFC489', // 3500K
                '#FFD1A3', // 4000K
                '#FFE4CE', // 5000K
                '#FFF9FD', // 6500K
                '#EC163C', // REDPINK
                '#E31A76', // MAGENTA
                '#DA3DB2', // PINK
                '#87319C', // VIOLET
                '#0077C9', // BLUE
                '#00A398', // CYAN
                '#00AF66', // TEAL
                '#74BC1C', // LIGHT GREEN
                '#FFA405', // YELLOW
                '#FF4E04', // ORANGE
                '#FF051C', // RED
            ],
            programs: [
                {
                    icon: 'cloud-rainbow',
                    id: 'fade1'
                }
            ]
        })

        this.setCommandRegistry({
            setColor: (device, params) => {
                this.setState(device, { 
                    color: params.get('color'),
                    program: null
                })

                this.setStatus(device, true);
            },

            setProgram: (device, params) => {
                this.setState(device, { 
                    color: null,
                    program: params.get('program')
                })
                
                this.setStatus(device, true);
            }
        })
    }

    setStatus(device: Device, status: boolean) {
        const switchTrait = device.getTraitOrFail(SwitchTrait);
        if(!switchTrait) return;
            
        switchTrait.setState(device, { status });
    }

    getAngle(device: Device, input: string) {
        return device.getMetadata(`traits.color.inputs.${input}.angle`);
    }
}