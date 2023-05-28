import ExtensionModule from '../extensions/ExtensionModule';
import DeviceState from './DeviceState';
import Device from './Device';
import type { DeviceDriverManifest, DeviceDriverManifestInputType, DeviceProps } from 'types';

export default class DeviceDriver extends ExtensionModule {
    device: Device;
    options: any;

    /**
     * Create a new instance.
     * @param device - The device that the driver works for.
     */
    constructor(device: Device) {
        super();

        this.device = device;
        this.options = this.device.getProp('driver.options') || {};

        this.setup();
    }

    /**
     * Is called once to allow for setting up any event listeners.
     */
    setup(): void {}

    getManifest(): DeviceDriverManifest {
        return {};
    }

    /**
     * Create a DeviceState representing the current state of the device.
     * @returns The current state.
     */
    getState(): DeviceState {
        const state = new DeviceState();

        state.setIsActive(false);

        return state;
    }

    /**
     *
     * @param current - The current connector config.
     * @returns The modified connector config.
     */
    modifyConnectorConfig(current: DeviceProps['connector']): DeviceProps['connector'] {
        return current;
    }

    /**
     * @param name - The name of the input to write.
     * @param value - The value to write.
     * @param callback - The callback to call when the value is set.
     */
    handleInput(name: string, value: any, callback: (err?: Error) => any): void {
        callback();
    }
}
