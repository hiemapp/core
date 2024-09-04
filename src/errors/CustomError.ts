import { NotificationProps } from '~/notifications/Notification.types' 
import ModelWithProps from '~/lib/ModelWithProps';import { Icon } from '~/ui';
import _ from 'lodash';

export interface CustomErrorOptions {
    message: string;
    icon?: Icon;
    status?: number;
    ctx?: Record<string, ModelWithProps<any>>;
}

export default class CustomError extends Error {
    protected options: CustomErrorOptions;

    constructor(options: CustomErrorOptions) {
        super(options.message);
        
        this.options = options;
        this.name = this.constructor.name;
    }

    getStatus() {
        return this.options.status;
    }

    getIcon() {
        return this.options.icon ?? null;
    }

    getMessage() {
        return this.options.message;
    }

    getNotificationMessage(): NotificationProps['message'] {
        // Deduce the model type from the error name:
        // - 'DeviceConnectionError' -> 'device'
        // - 'ExtensionModuleNotRegisteredError' -> 'extension'
        const modelType = _.snakeCase(this.name).split('_')[0];

        // Deduce the error type from the error name
        // - 'DeviceConnectionError' -> 'connectionError',
        // - 'ExtensionModuleNotRegisteredError' -> 'moduleNotRegisteredError'
        const errorType = _.camelCase(this.name.slice(modelType.length));

        return {
            id: `@global.errors.${modelType}.${errorType}`,
            ctx: this.options.ctx
        }
    }
}