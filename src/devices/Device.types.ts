import type { Icon } from '~/ui';
import type { ModelEventReason } from '~/lib/ModelEvent';
import DeviceTrait from './DeviceTrait/DeviceTrait';
import { DeviceTrait_config } from './DeviceTrait/DeviceTrait.types';
import DeviceDisplay, { DeviceDisplayRecord, DeviceDisplaySerialized, DeviceDisplayTextList } from './DeviceDisplay';

export type DeviceType = {
    id: number,
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
        },
        'ping': {}
    }
}

export interface DeviceProps {
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
        /**
         * The interval in seconds at which the device should emit a 'ping' event.
         */
        pingInterval: number;
    };
    metadata: Record<string, any>
}

export interface DevicePropsSerialized extends DeviceProps {
    connection: {
        isOpen: boolean
    },
    display: DeviceDisplaySerialized,
    state: Record<string, any>,
    traits: Array<{
        name: string;
        options: DeviceTrait<any>['options']
        config: DeviceTrait_config
    }>
}