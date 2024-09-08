import { ModelWithProps as ModelWithProps2 } from '~/lib';
import Script from '~/scripts/Script';

abstract class ModelWithProps<TModel extends ModelWithProps2<any>> {
    protected $script: Script;
    protected _id: string;
    protected _model: TModel;

    get id() { return this._model.id }

    constructor(model: TModel, script: Script) {
        this._model = model;
        this.$script = script;
    }
}

export { ModelWithProps as ModelWithProps_SA };