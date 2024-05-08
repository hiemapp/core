import { ExtensionModuleFactory, type ExtensionModuleConfig } from '../extensions/ExtensionModule';
import DeviceState from './DeviceState';
import Device from './Device';
import type { DeviceDriverManifest } from './DeviceDriver.types';
import type { DeviceType } from './Device.types';

export default class DeviceDriver extends ExtensionModuleFactory<DeviceDriverManifest>() {
    device: Device;
    options: any;

    static extensionModuleConfig: ExtensionModuleConfig = {
        manifestRequired: true
    }

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
    setup(): void { }

    /**
     * Create a DeviceState representing the current state of the device.
     * @returns The current state.
     */
    getState(): DeviceState | void {
        const state = new DeviceState();

        state.setIsActive(false);

        return state;
    }

    /**
     *
     * @param current - The current connector config.
     * @returns The modified connector config.
     */
    modifyConnectorConfig(current: DeviceType['props']['connector']): DeviceType['props']['connector'] {
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

    getInputs() {
        return this.manifest.getArr('inputs');
    }
}