import type { ModelEventReason } from '~/lib/ModelEvent';

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