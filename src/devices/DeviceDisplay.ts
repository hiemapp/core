import { Color, Icon } from '~/ui';
import _ from 'lodash';
import { User } from '~/users';
import DeviceDisplayFormatters from '~/devices/DeviceDisplayFormatters';

export type DeviceDisplayTextList = DeviceDisplayText[];
export interface DeviceDisplayText {
    text?: string|null;
    message?: string;
}

export interface DeviceDisplayRecord {
    field: string;
}

export interface DeviceDisplayRichContent {
    thumbnail?: string;
    title?: DeviceDisplayText;
    description?: DeviceDisplayText;
}

export interface DeviceDisplaySerialized {
    isActive: boolean;
    content: DeviceDisplay['content'];
    richContent: DeviceDisplayRichContent;
}

export default class DeviceDisplay {
    protected richContent: DeviceDisplayRichContent = {};
    protected _isActive: boolean;
    protected content: {
        textList?: DeviceDisplayTextList,
        record?: DeviceDisplayRecord
    } = {};
    public readonly formatters: DeviceDisplayFormatters;

    constructor(user?: User) {
        this.formatters = new DeviceDisplayFormatters(user);
    }

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
        return this;
    }

    setRecord(record: DeviceDisplayRecord) {
        this.content.record = record;
        return this;
    }

    serialize(): DeviceDisplaySerialized {      
        return {
            isActive: this.isActive(),
            content: this.content,
            richContent: this.richContent
        } 
    }
}
