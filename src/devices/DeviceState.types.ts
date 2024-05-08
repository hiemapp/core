export interface DeviceStateDisplay {
    buttons?: DeviceStateDisplayButton[];
    recording?: DeviceStateDisplayRecording;
    tile?: DeviceStateDisplayTile;
    text?: DeviceStateDisplayText
}

export interface DeviceStateDisplayText {
    content: string | number;
}

export interface DeviceStateDisplayButton {
    icon: string;
    input: string;
    color?: string;
    isActive?: boolean;
}

export interface DeviceStateDisplayTile {
    title: string;
    icon?: string;
    thumbnailSrc?: string;
    description?: string;
}

export interface DeviceStateDisplayRecording {
    field: string;
}
