import { Icon } from '~/ui';
import { ModelWithProps_SA } from '../lib/ModelWithProps.script-api';
import { Device as Device2 } from '~/devices';
import { SwitchTrait } from '~/devices/DeviceTrait/traits';
import { Constructor } from '~types/helpers';
import DeviceTrait from '~/devices/DeviceTrait/DeviceTrait';

class Device extends ModelWithProps_SA<Device2> {
    /**
     * Check if the device is currently turned on.
     * @returns Whether the device is currently turned on.
     */
    isOn() { this._checkTrait(SwitchTrait); return !!this._model.getState().status; }

    /**
     * Check if the device is currently turned off.
     * @returns Whether the device is currently turned off.
     */
    isOff() { this._checkTrait(SwitchTrait); return !this._model.getState().status; }

    /**
     * Check if the device is currently open.
     * @returns Whether the device is currently open.
     */
    isOpen() { this._checkTrait(SwitchTrait); return !!this._model.getState().openStatus; }
    
     /**
     * Check if the device is currently closed.
     * @returns Whether the device is currently closed.
     */
    isClosed() { this._checkTrait(SwitchTrait); return !this._model.getState().openStatus; }

    /**
     * Turn the device on, if supported.
     * @returns The device.
     */
    turnOn() { this._model.execute('toggleStatus', { status: true }, this.$script); return this; }
    
    /**
     * Turn the device off, if supported.
     * @returns The device.
     */
    turnOff() { this._model.execute('toggleStatus', { status: false }, this.$script); return this; }

    /**
     * Open the device, if supported.
     * @returns The device.
     */
    open() { this._model.execute('open', {}, this.$script); return this; }

    /**
     * Close the device, if supported.
     * @returns The device.
     */
    close() { this._model.execute('close', {}, this.$script); return this; }

    /**
     * Stop the device, if supported.
     * @returns The device.
     */
    stop() { this._model.execute('stop', {}, this.$script); return this; }
    
    /**
     * The name of the device.
     */
    get name(): string { return this._model.getProp('name')!; }

    /**
     * Set the name of the device.
     * @param name The new name.
     * @returns The device.
     */
    setName(name: string) { this._model.setProp('name', name); return this; }

    /**
     * The icon of the device.
     */
    get icon(): string { return this._model.getProp('icon'); }

    /**
     * Set the icon of the device.
     * @param icon The new icon.
     * @returns The device.
     */
    setIcon(icon: Icon) { this._model.setProp('icon', icon); return this; }

    /**
     * The color of the device.
     */
    get color(): string { return this._model.getProp('color')!; }

    /**
     * Set the color of the device.
     * @param color The new color.
     * @returns The device.
     */
    setColor(color: string) { this._model.setProp('color', color); return this; }

    protected _checkTrait(trait: Constructor<DeviceTrait<any>>) {
        this._model.getTrait(trait);
    }

    initEventListeners() {
        this._model.on('execute:start', data => this.handleEvent(`commands:before:${data.command}`, data))
        this._model.on('execute:done', data => this.handleEvent(`commands:after:${data.command}`, data))
    }

    onStateChange(callback: (...args: any) => unknown) {
        return this.on('state:update', callback);
    }

    onToggle(callback: (...args: any[]) => unknown) {
        let isOn = this.isOn();

        return this.on('state:update', (...args) => {
            if(isOn === this.isOn()) return;
            
            isOn = this.isOn()
            callback(...args)
        })
    }

    /**
     * Add an event listener for a command, before execution.
     * @param command The name of the command.
     * @param callback The callback.
     */
    beforeCommand(command: string, callback: (data: any) => unknown) {
        return this.$script.eventListeners.add(`commands:before:${command}`, callback, this._model);
    }
    
    /**
     * Add an event listener for a command, after execution.
     * @param command The name of the command.
     * @param callback The callback.
     */
    afterCommand(command: string, callback: (data: any) => unknown) {
        return this.$script.eventListeners.add(`commands:after:${command}`, callback, this._model);
    }
}

export { Device as Device_SA }