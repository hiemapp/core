import DeviceTrait from '../DeviceTrait';
import { DeviceTraitDefaultOptions } from '../DeviceTrait.types';

export interface IOpenCloseTrait {
    commands: {
        open: {},
        close: {},
        stop: {},
    },
    state: {
        openStatus: boolean;
    },
    options: DeviceTraitDefaultOptions<IOpenCloseTrait> & {
        stoppable?: boolean;
        direction?: string;
    }
}

export class OpenCloseTrait extends DeviceTrait<IOpenCloseTrait> {
    protected init() {
        this.setConfig({
            menu: true
        })

        this.setDefaultOptions({
            stoppable: true,
            direction: 'vertical',
            passive: false,
            primaryAction: false
        })

        this.setDisplayProvider((device, display) => {
            const { openStatus } = this.getState(device);

            display.setActive(openStatus);
            display.setText({
                message: `@hiem/core.devices.traits.openCloseTrait.openStatus.${openStatus ? 'open' : 'closed'}.label`
            })
        })

        this.setCommandRegistry({
            open: device => {
                this.setState(device, { openStatus: true })
            },
            close: device => {
                this.setState(device, { openStatus: false })
            },
            stop: null
        })
    }
}