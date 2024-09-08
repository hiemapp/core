import { ModelWithProps } from '~/lib';
import { ModelWithProps_SA } from './ModelWithProps.script-api';
import { Constructor } from '~types/helpers';
import { ControllerType } from '~/lib/Controller';
import Script from '../../Script';

export interface IApiControllerModuleIndex<TModel extends ModelWithProps_SA<any>> {
    get: (id: number) => TModel,
    getAll: () => TModel[],
}

export type IApiControllerModule<TModule extends ApiControllerModule<any>> = Omit<TModule, '_init'>

export class ApiControllerModule<TModel extends ModelWithProps_SA<any>> {
    protected _models: Record<number, TModel> = {};
    protected _model;
    protected _innerModel;
    protected _controller: ControllerType;
    protected $script: Script;

    constructor(model: Constructor<TModel>, innerModel: Constructor<ModelWithProps<any>>) {           
        this._model = model;
        this._innerModel = innerModel;
        this._controller = this._innerModel.prototype.__modelConfig().controller;
    }

    get(id: number) {
        return this._models[id];
    }

    list() {
        return Object.values(this._models);
    }
    
    _init(script: Script) {
        this.$script = script;

        this._controller.index().forEach(model => {
            this._models[model.id] = new this._model(model, this.$script);
        })
    }
}