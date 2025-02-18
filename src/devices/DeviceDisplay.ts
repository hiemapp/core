import { Color, Icon } from '~/ui';
import _ from 'lodash';
import { User } from '~/users';
import DeviceDisplayFormatters from '~/devices/DeviceDisplayFormatters';
import { z } from 'zod';

export const DeviceDisplayTextSchema = z.object({
    text: z.string().nullable().optional(),
    html: z.string().nullable().optional(),
    message: z.string().nullable().optional()
})

export const DeviceDisplayRecordSchema = z.object({
    field: z.string()
})

export const DeviceDisplaySchema = z.object({
    isActive: z.boolean(),
    content: z.object({
        textList: z.array(DeviceDisplayTextSchema).optional(),
        record: DeviceDisplayRecordSchema.optional()
    }),
    richContent: z.object({
        thumbnail: z.string().optional(),
        title: DeviceDisplayTextSchema.optional(),
        description: DeviceDisplayTextSchema.optional()
    })
})

export default class DeviceDisplay {
    protected richContent: z.infer<typeof DeviceDisplaySchema>['richContent'] = {};
    protected _isActive: boolean;
    protected content: z.infer<typeof DeviceDisplaySchema>['content'] = {};
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
     * @param override - Whether `isActive` should be set to false, if currently true.
     * 
     * @example
     * setActive(true)        // `isActive` is now true.
     * setActive(false)       // `isActive` remains true (`overrideActive` defaults to false).
     * setActive(false, true) // `isActive` is now false.
     */
    setActive(isActive: boolean, overrideActive: boolean = false): this {
        if(this._isActive && !overrideActive) return this;

        this._isActive = isActive;
        return this;
    }

    setText(text: z.infer<typeof DeviceDisplayTextSchema>) {
        this.content.textList = [ text ];
        return this;
    }

    addText(text: z.infer<typeof DeviceDisplayTextSchema>) {
        this.content.textList ??= [];
        this.content.textList.push(text);
        return this;
    }

    setRecord(record: z.infer<typeof DeviceDisplayRecordSchema>) {
        this.content.record = record;
        return this;
    }

    toJSON(): z.infer<typeof DeviceDisplaySchema> {      
        return {
            isActive: this.isActive(),
            content: this.content,
            richContent: this.richContent
        } 
    }
}
