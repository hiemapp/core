import type { 
    DeviceStateDisplay,
    DeviceStateDisplayButton, 
    DeviceStateDisplayTile, 
    DeviceStateDisplayRecording,
    DeviceStateDisplayText
} from './DeviceState.types';

export default class DeviceState {
    protected _isActive: boolean;
    protected _display: DeviceStateDisplay = {};

    get isActive() {
        return this._isActive;
    }
    /**
     * Set the active state.
     * @param isActive - Whether the device state should be active.
     */
    setIsActive(isActive: boolean): this {
        this._isActive = !!isActive;
        return this;
    }

    addButtonDisplay(display: DeviceStateDisplayButton[]) {
        this._display.buttons = display;
        return this;
    }

    addTileDisplay(display: DeviceStateDisplayTile) {
        this._display.tile = display;
        return this;
    }

    addRecordingDisplay(display: DeviceStateDisplayRecording) {
        this._display.recording = display;
        return this;
    }

    addTextDisplay(display: DeviceStateDisplayText) {
        this._display.text = display;
        return this;
    }

    toJSON() {
        return {
            isActive: this._isActive,
            display: this._display,
        };
    }
}
