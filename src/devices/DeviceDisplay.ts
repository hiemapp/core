import { Color, Icon } from '~/ui';
import _ from 'lodash';

export type DeviceDisplayTextList = DeviceDisplayText[];
export interface DeviceDisplayText {
    text?: string;
    message?: string;
}

export interface DeviceDisplayRecord {
    field: string;
}

export default class DeviceDisplay {
    protected _isActive: boolean;
    protected content: {
        textList?: DeviceDisplayTextList,
        record?: DeviceDisplayRecord
    } = {};

    /**
     * Get the active state.
     */
    isActive() {
        return !!this._isActive;
    }

    /**
     * Set the active state.
     * @param isActive - Whether the device display should be active.
     */
    setActive(isActive: boolean): this {
        this._isActive = isActive;
        return this;
    }

    setText(text: DeviceDisplayText) {
        this.content.textList = [ text ];
        return this;
    }

    addText(text: DeviceDisplayText) {
        this.content.textList ??= [];
        this.content.textList.push(text);
    }

    setRecord(record: DeviceDisplayRecord) {
        this.content.record = record;
        return this;
    }

    serialize() {      
        return {
            isActive: this.isActive(),
            content: this.content
        } 
    }
}
