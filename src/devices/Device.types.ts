import { ModelWithPropsType } from '~/lib/ModelWithProps';
import type { DeviceStateDisplay } from './DeviceState.types';
import type { Icon } from '~/utils';
import type { DriverInputEvent, UpdateEvent, ConnectionCloseEvent, ConnectionOpenEvent } from './events.types';

export interface DeviceType extends ModelWithPropsType {
    id: number,
    props: DeviceProps,
    serializedProps: DevicePropsSerialized,
    events: {
        'driver:input': {
            data: DriverInputEvent
        },
        'update': {
            data: UpdateEvent
        },
        'connection:close': {
            data: ConnectionCloseEvent
        },
        'connection:open': {
            data: ConnectionOpenEvent
        }
    }
}

interface DeviceProps {
    id: number;
    name: string;
    icon: Icon;
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

interface DevicePropsSerialized extends DeviceProps {
    connection: {
        exists: boolean,
        isOpen: boolean
    },
    state: {
        isActive: boolean,
        display: DeviceStateDisplay
    }
}