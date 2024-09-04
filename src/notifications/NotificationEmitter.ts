import TypedEventEmitter from '~/utils/TypedEventEmitter';
import type Notification from './Notification';

export interface NotificationEmitterEvents {
    notification: [{
        notification: Notification 
    }]
}

class NotificationEmitterClass extends TypedEventEmitter<NotificationEmitterEvents> {

}

const NotificationEmitter = new NotificationEmitterClass();
export default NotificationEmitter;