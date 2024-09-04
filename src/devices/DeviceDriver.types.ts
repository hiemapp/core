import { Color } from '~/ui/constants/style/colors';
import type Device from './Device';
import DeviceTrait from './DeviceTrait/DeviceTrait';
import DeviceCommandParams from './DeviceTrait/DeviceCommandParams';

export type DeviceDriverCommandHandler<TParams extends Record<string, any>> = (device: Device, params: DeviceCommandParams<TParams>) => unknown;

export interface DeviceDriverManifest {
    recording?: {
        supported?: boolean;
        fields?: Array<{
            id: number;
            name: string;
            // type: string;
            color?: Color;
            primary?: boolean;
        }>;
    };
    traits?: DeviceTrait<any>[]
}