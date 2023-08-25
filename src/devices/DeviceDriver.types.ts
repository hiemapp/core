import { type Color } from '~/utils/style/colors';

export type DeviceDriverManifestInputType = 'TOGGLE' | 'COLOR' | 'OPEN' | 'CLOSE' | 'STOP';
export interface DeviceDriverManifest {
    recording?: {
        supported?: boolean;
        fields?: Array<{
            name: string;
            // type: string;
            color?: Color;
            primary?: boolean;
        }>;
    };
    inputs?: Array<{
        name: string;
        type: DeviceDriverManifestInputType;
    }>;
}
