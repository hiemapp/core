export type DeviceDriverManifestInputType = 'toggle' | 'color' | 'open' | 'close' | 'stop';
export interface DeviceDriverManifest {
    recording?: {
        supported?: boolean;
        fields?: Array<{
            name: string;
            type: string;
            color?: string;
            primary?: boolean;
        }>;
    };
    inputs?: Array<{
        name: string;
        type: DeviceDriverManifestInputType;
    }>;
}
