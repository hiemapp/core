import type { DeviceStateDisplay } from './DeviceState';

export interface DeviceProps {
    id: number;
    name: string;
    icon: string;
    color: string;
    driver: {
        type: string | null;
        options: Record<string, any>
    };
    connector: {
        type: string | null;
        options: Record<string, any>
    },
    options: {
        recording: {
            enabled: boolean;
            cooldown: number;
            flushThreshold: number;
        };
    };
    metadata: Record<string, any>
}

export interface DevicePropsSerialized extends DeviceProps {
    connection: {
        exists: boolean,
        isOpen: boolean
    },
    state: {
        isActive: boolean,
        display: DeviceStateDisplay
    }
}