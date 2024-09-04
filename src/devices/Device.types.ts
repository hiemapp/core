import { ModelWithPropsType } from '~/lib/ModelWithProps';
import type { Icon } from '~/ui';
import type { ModelEventReason } from '~/lib/ModelEvent';
import DeviceTrait from './DeviceTrait/DeviceTrait';
import { DeviceTrait_config } from './DeviceTrait/DeviceTrait.types';
import { DeviceDisplayRecord, DeviceDisplayText } from './DeviceDisplay';

export type DeviceType = ModelWithPropsType & {
    id: number,
    props: DeviceProps,
    serializedProps: DevicePropsSerialized,
    events: {
        'input': {
            name: string,
            value: any,
            reason: ModelEventReason,
            cancel?: () => void
        },
        'update': {
            reason?: string;
            data?: any;
        },
        'state:update': {
            reason?: string;
            data?: any;
        },
        'connection:update': {
            reason?: string;
            data?: any;
        },
        'execute:start': {
            command: string;
            params: Record<string, any>;
        }
        'execute:done': {
            command: string;
            params: Record<string, any>;
            success: boolean;
        }
    }
}

export interface DeviceProps {
    id: number;
    name: string;
    icon: Icon;
    color: string;
    driver: {
        type: string | null;
        options: Record<string, any>
    };
    connectorId: number | null;
    options: {
        recording: {
            enabled: boolean;
            cooldown: number;
            flushThreshold: number;
        };
        dummy: boolean;
    };
    metadata: Record<string, any>
}

export interface DevicePropsSerialized extends DeviceProps {
    connection: {
        isOpen: boolean
    },
    display: {
        isActive: boolean;
        content: {
            text?: DeviceDisplayText,
            record?: DeviceDisplayRecord
        }
    },
    state: Record<string, any>,
    traits: Array<{
        name: string;
        options: DeviceTrait<any>['options']
        config: DeviceTrait_config
    }>
}