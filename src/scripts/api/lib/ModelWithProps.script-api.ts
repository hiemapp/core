import { ModelWithProps as ModelWithProps2 } from '~/lib';
import { EventData, EventName } from '~/lib/Model';
import Script from '~/scripts/Script';

abstract class ModelWithProps<TModel extends ModelWithProps2<any>> {
    protected $script: Script;
    protected _id: string;
    protected _model: TModel;

    get id() { return this._model.id }

    constructor(model: TModel, script: Script) {
        this._model = model;
        this.$script = script;
        this.initEventListeners();
    }

    abstract initEventListeners(): void

    protected handleEvent(event: string, data: any) {
        this.$script.eventListeners.handle(this._model, event, data);
    }

    /**
     * Add an event listener.
     */
    on(event: string, callback: (data: any) => unknown) {
        this.$script.eventListeners.add(event, callback, this._model, () => {
            console.log('OFF!', event, callback)
            this.off(event, callback, false);
        });

        this._model.on(event, callback);
    }

    /**
     * Remove an event listener.
     */
    off(event: string, callback: (data: any) => unknown, updateManager = true) {
        if(updateManager) {
            this.$script.eventListeners.remove(event, callback, this._model);
        }
        
        return this._model.off(event, callback);
    }
}

export { ModelWithProps as ModelWithProps_SA };