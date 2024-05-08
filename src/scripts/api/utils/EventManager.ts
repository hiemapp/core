import Model from '~/lib/Model';

export default class EventManager {
    bucket: any[] = [];

    add(model: Model<any>, event: string, listener: (...args: any[]) => unknown) {
        // Add the listener to the bucket
        this.bucket.push({ model, event, listener });

        return model.on(event, listener);
    }

    remove(model: Model<any>, event: string, listener: (...args: any[]) => unknown) {
        return model.off(event, listener);
    }

    removeAll() {
        return this.bucket.forEach(item => {
            this.remove(item.model, item.event, item.listener);
        })
    }
}