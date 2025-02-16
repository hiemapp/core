import { Color } from '~/ui/constants/style/colors';
import type Device from './Device';
import DeviceTrait from './DeviceTrait/DeviceTrait';
import DeviceCommandParams from './DeviceTrait/DeviceCommandParams';
import { fieldTypes } from '~/records';

export type DeviceDriverCommandHandler<TParams extends Record<string, any>> = (device: Device, params: DeviceCommandParams<TParams>) => unknown;
export type DeviceDriverManifestRecordingField = {
    name: string;
    type?: typeof fieldTypes[keyof typeof fieldTypes];
    color?: Color;
    hiddenByDefault?: boolean;

    /** 
     * The id used for storing records as CSV. 
     * @deprecated 
     */
    id?: number;

    /** Whether the values should be inverted, such that they appear below zero. */
    invert?: boolean;
}

export interface DeviceDriverManifest {
    recording?: {
        supported?: boolean;
        fields?: DeviceDriverManifestRecordingField[]
    };
    traits?: DeviceTrait<any>[]
}