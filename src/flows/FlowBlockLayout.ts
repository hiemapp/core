import _ from 'lodash';
import { IFlowBlockLayout, IFlowBlockLayoutSerialized } from './FlowBlockLayout.types';
import Model from '~/lib/Model';

export default class FlowBlockLayout {
    json: Required<IFlowBlockLayout>;

    constructor(json: any) {
        this.json = this.extend(json);
    }

    getParameters() { return this.json.parameters; }
    getParameterOrFail(id: string) { return this.getInputOrFail(this.getParameters(), id); }

    getStatements() { return this.json.statements; }
    getStatementOrFail(id: string) { return this.getInputOrFail(this.getStatements(), id); }

    protected getInputOrFail<T extends {id: string}>(inputs: T[], id: string) {
        return inputs.find(input => input.id.toUpperCase() === id.toUpperCase()) ?? null;
    }

    serialize() {
        const json = {...this.json};

        // Convert models to a { label, value } object
        json.parameters = json.parameters.map(param => {
            if(Array.isArray(param.options)) {
                param.options = param.options.map(opt => {
                    if(opt instanceof Model) {
                        return { value: opt.id, label: opt.getProp('name') };
                    }

                    return opt;
                })
            }

            return param;
        })

        return json;
    }

    extend(json: IFlowBlockLayout): Required<IFlowBlockLayout> {
        if(!Array.isArray(json.statements)) json.statements = [];
        if(!Array.isArray(json.parameters)) json.parameters = [];

        // Ensure that `json.output` is an object
        json.output = _.isPlainObject(json.output) ? json.output! : {};

        // Ensure that `json.connections` is an object with `top` and `bottom` boolean properties
        json.connections = _.isPlainObject(json.connections) ? json.connections! : {};
        json.connections.top ??= !json.output.type;
        json.connections.top = !!json.connections.top;
        json.connections.bottom ??= !json.output.type;
        json.connections.bottom = !!json.connections.bottom;

        // Remove parameters that dont have an `id` or `type` property
        json.parameters = json.parameters.filter(p => typeof p.id === 'string' && typeof p.type === 'string');

        // Remove statements that dont have an `id` property
        json.statements = json.statements.filter(p => typeof p.id === 'string');

        return json as Required<IFlowBlockLayout>;
    }
}