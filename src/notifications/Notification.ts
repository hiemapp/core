import type User from '../users/User';
import NotificationEmitter from './NotificationEmitter';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from './Notification.types';
import ModelWithProps, { DynamicProps, InferSchema } from '~/lib/ModelWithProps';
import { icons, style } from '~/ui';
import _ from 'lodash';
import type { Socket } from 'socket.io';
import CustomError from '~/errors/CustomError';
import { z } from 'zod';

export type Recipient = User | Socket;

const DEFAULT_PROPS: Record<string, Partial<InferSchema<Notification>>> = {
    error: { icon: icons.XMARK, palette: style.palettes.RED },
    info: { icon: icons.INFO, palette: style.palettes.BLUE },
    notice: { icon: icons.EXCLAMATION, palette: style.palettes.PURPLE },
    warning: { icon: icons.EXCLAMATION, palette: style.palettes.YELLOW }
}

export default class Notification extends ModelWithProps<NotificationType> {
    public readonly uuid: string;

    protected $schema = z.object({
        message: z.union(
            [
                z.object({
                    id: z.number(),
                    values: z.record(z.string(), z.any()).optional(),
                    ctx: z.record(z.string(), z.any()).optional()
                }),
                z.any()
            ]
        ).nullable(),
        level: z.string(),
        icon: z.string().nullable(),
        palette: z.any().nullable(),
        body: z.string().nullable(),
        isHTML: z.boolean().default(false)
    });

    protected $dynamicProps: DynamicProps<Notification> = {
        icon: () => this.getProp('icon') ?? DEFAULT_PROPS[this.getProp('level')].icon!,
        palette: () => this.getProp('palette') ?? DEFAULT_PROPS[this.getProp('level')].palette!,
        message: () => {
            const message = this.getProp('message');

            if (typeof message === 'object' && message?.id && message?.ctx) {
                message.values ??= {};

                _.forOwn(message.ctx, (model, key) => {
                    if (!(model instanceof ModelWithProps)) return;

                    const props = model.getProps();
                    _.forOwn(props, (value, name) => {
                        if (_.isObject(value)) return;
                        message.values![`${key}_${name}`] = value + '';
                    })
                })

                delete message.ctx;
            }

            return message;
        }
    }

    protected _recipients: Recipient[] = [];
    get recipients() { return this._recipients };

    constructor(message?: InferSchema<Notification>['message'], level?: InferSchema<Notification>['level'], icon?: InferSchema<Notification>['icon']) {
        super(uuidv4());

        super.setProp('message', message);
        super.setProp('level', level);
        super.setProp('icon', icon);
    }

    /**
     * Create a notification from any error.
     * @example
     * @returns The notification.
     */
    static fromError(error: any) {
        const notification = new Notification(null, 'error');

        if (error instanceof CustomError) {
            notification.setMessage(error.getNotificationMessage());
            notification.setIcon(error.getIcon());
        } else if (error instanceof Error) {
            notification.setMessage(error.message);
        } else if (typeof error === 'string') {
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
    setIcon(icon: InferSchema<Notification>['icon']) { return this.setProp('icon', icon); }

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
    setPalette(palette: InferSchema<Notification>['palette']) { return this.setProp('palette', palette); }

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
     *     id: '$main.errors.device.genericError',
     *     ctx: { device }
     * })
     * ```
     * @param message The notification message.
     * @returns The notification.
     */
    setMessage(message: InferSchema<Notification>['message']) { return this.setProp('message', message); }

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
    setLevel(level: InferSchema<Notification>['level']) { return this.setProp('level', level); }

    /**
     * Get the notification body.
     * @returns The notification body.
     */
    getBody() {
        return this.getProp('body');
    }

    /**
     * Set the notification body.
     * @param body The notification body.
     * @returns The notification.
     */
    setBody(body: string, isHTML = false) {
        this.setProp('body', body);
        this.setProp('isHTML', isHTML);
        return this;
    }

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