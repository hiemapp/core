import type Model from '~/lib/Model';
import type { ModelType as BaseModelType } from '~/lib/Model';
import type { Model as IModel } from '~types/scripts/ScriptApi';
import type Api from '../ScriptApi';

export default class ModelWrapper<TModel extends Model<any>, ModelType extends BaseModelType> implements IModel<ModelType> {
    protected model;
    protected api;

    constructor(model: TModel, api: Api) {
        this.model = model;
        this.api = api;
    }

    getId(): number { return this.model.getId(); }

    on(event: string, listener: (...args: any[]) => unknown) {
        return this.api.eventManager.add(this.model, event, listener);
    }

    off(event: string, listener: (...args: any[]) => unknown) {
        return this.api.eventManager.remove(this.model, event, listener);
    }
}