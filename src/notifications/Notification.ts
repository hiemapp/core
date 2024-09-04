import type User from '../users/User';
import NotificationEmitter from './NotificationEmitter';
import { v4 as uuidv4 } from 'uuid';
import { NotificationProps, NotificationType } from './Notification.types';
import ModelWithProps, { ModelWithPropsConfig } from '~/lib/ModelWithProps';
import { icons, style } from '~/ui';
import _ from 'lodash';
import type { Socket } from 'socket.io';
import CustomError from '~/errors/CustomError';

export type Recipient = User | Socket;

const DEFAULT_PROPS: Record<NotificationProps['level'], Partial<NotificationProps>> = {
    error: { icon: icons.XMARK, palette: style.palettes.RED },
    info: { icon: icons.INFO, palette: style.palettes.BLUE },
    notice: { icon: icons.EXCLAMATION, palette: style.palettes.PURPLE },
    warning: { icon: icons.EXCLAMATION, palette: style.palettes.YELLOW }
}

export default class Notification extends ModelWithProps<NotificationType> {
    public readonly uuid: string;

    __modelConfig(): ModelWithPropsConfig<NotificationType> {
        return {
            controller: null,
            defaults: {
                message: 'A message.',
                level: 'info',
                icon: null,
                palette: null
            },
            dynamicProps: {
                icon: () => this.getProp('icon') ?? DEFAULT_PROPS[this.getProp('level')].icon!,
                palette: () => this.getProp('palette') ?? DEFAULT_PROPS[this.getProp('level')].palette!,
                message: () => {
                    const message = this.getProp('message');

                    if(typeof message === 'object' && message?.id && message?.ctx) {
                        message.values ??= {};

                        _.forOwn(message.ctx, (model, key) => {
                            if(!(model instanceof ModelWithProps)) return;

                            const props = model.getProps();
                            _.forOwn(props, (value, name) => {
                                if(_.isObject(value)) return;
                                message.values![`${key}_${name}`] = value+'';
                            })
                        })

                        delete message.ctx;
                    }

                    return message;
                }
            }
        }
    }

    protected _recipients: Recipient[] = [];
    get recipients() { return this._recipients };

    constructor(message?: NotificationProps['message'], level?: NotificationProps['level'], icon?: NotificationProps['icon']) {
        super(uuidv4(), { message, level, icon });
    }

    /**
     * Create a notification from any error.
     * @example
     * @returns The notification.
     */
    static fromError(error: any) {
        const notification = new Notification(null, 'error');

        if(error instanceof CustomError) {
            notification.setMessage(error.getNotificationMessage());
            notification.setIcon(error.getIcon());
        } else if(error instanceof Error) {
            notification.setMessage(error.message);
        } else if(typeof error === 'string') {
            notification.setMessage(error);
        } else {
            notification.setMessage({
                id: 'errors.genericError'
            })
        }

        return notification;
    }

    /**
     * Get the notification icon.
     * @returns The notification icon.
     */
    getIcon() { return this.getProp('icon'); }

    /**
     * Set the notification icon.
     * @param icon The notification icon.
     * @returns The notification.
     */
    setIcon(icon: NotificationProps['icon']) { return this.setProp('icon', icon); }

    /**
     * Get the notification palette.
     * @returns The notification palette.
     */
    getPalette() { return this.getProp('palette'); }

    /**
     * Set the notification palette.
     * @param palette The notification palette.
     * @returns The notification.
     */
    setPalette(palette: NotificationProps['palette']) { return this.setProp('palette', palette); }

    /**
     * Get the notification message.
     * @returns The notification message.
     */
    getMessage() { return this.getProp('message'); }

    /**
     * Set the notification message.
     * @example
     * ```
     * Notification.setMessage({
     *     id: '@global.errors.device.genericError',
     *     ctx: { device }
     * })
     * ```
     * @param message The notification message.
     * @returns The notification.
     */
    setMessage(message: NotificationProps['message']) { return this.setProp('message', message); }

    /**
     * Get the notification level.
     * @returns The notification level.
     */
    getLevel() { return this.getProp('level'); }

    /**
     * Set the notification level.
     * @param level The notification level.
     * @returns The notification.
     */
    setLevel(level: NotificationProps['level']) { return this.setProp('level', level); }

    /**
     * Shorthand for {@link Notification.addRecipients()} and {@link Notification.send()}.
     * @param recipients The recipients to send the notification to.
     * @returns The notification.
     */
    sendTo(...recipients: Recipient[]) {
        this.addRecipients(...recipients);
        return this.send();
    }

    /**
     * Send the notification.
     * @returns The notification.
     */
    send() {
        NotificationEmitter.emit('notification', { notification: this });
        return this;
    }

    /**
     * Add recipients to the notification.
     * @param recipients The recipients to add.
     * @returns The notification.
     */
    addRecipients(...recipients: Recipient[]) {
        this._recipients.push(...recipients);
        return this;
    }

    /**
     * Get the list of recipients of this notification.
     * @returns The list of recipients.
     */
    getRecipients() {
        return this._recipients;
    }
}