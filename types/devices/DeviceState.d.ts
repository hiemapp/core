export interface DeviceStateDisplay {
    buttons?: DeviceStateDisplayButton[];
    tile?: DeviceStateDisplayTile;
    recording?: DeviceStateDisplayRecording;
}
export interface DeviceStateDisplayButton extends DeviceStateDisplay {
    icon: string;
    input: string;
    color?: string;
    isActive?: boolean;
}
export interface DeviceStateDisplayTile extends DeviceStateDisplay {
    title: string;
    icon?: string;
    thumbnailSrc?: string;
    description?: string;
}
export interface DeviceStateDisplayRecording extends DeviceStateDisplay {
    field: string;
}
