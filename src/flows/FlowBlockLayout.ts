import _ from 'lodash';
import { IFlowBlockLayout, IFlowBlockLayoutSerialized } from './FlowBlockLayout.types';
import Model from '~/lib/Model';

export default class FlowBlockLayout {
    public static JSON_VALUE_PREFIX = '#json:'

    json: Required<IFlowBlockLayout>;

    constructor(json: any) {
        this.json = this.extend(json);
    }

    /**
     * Serialize a value, e.g. for dropdown values as they can only be strings.
     * @param value The value to serialize.
     * @returns The serialized value.
     */
    static serializeValue(value: any) {
        return this.JSON_VALUE_PREFIX+JSON.stringify(value);
    }

    /**
     * Check if a value is serialized using the .serializeValue() 
     * method, and deserialize it.
     * @param value The value to deserialize.
     * @returns The deserialized or original value.
     */
    static deserializeValue(value: any) {
        if(typeof value === 'string' && value.startsWith(this.JSON_VALUE_PREFIX)) {
            value = JSON.parse(value.slice(this.JSON_VALUE_PREFIX.length));
        }

        return value;
    }

    getParameters() { return this.json.parameters; }
    getParameterOrFail(id: string) { return this.getInputOrFail(this.getParameters(), id); }

    getStatements() { return this.json.statements; }
    getStatementOrFail(id: string) { return this.getInputOrFail(this.getStatements(), id); }

    protected getInputOrFail<T extends {id: string}>(inputs: T[], id: string) {
        return inputs.find(input => input.id.toUpperCase() === id.toUpperCase()) ?? null;
    }

    toJSON(): IFlowBlockLayoutSerialized {
        return {
            ...this.json,
            parameters: this.json.parameters.map(param => {
                if(!Array.isArray(param.options)) return param;

                return { 
                    ...param, 
                    options: param.options.map(opt => {
                        if(opt instanceof Model) {
                            opt = { value: opt.id, label: opt.getProp('name')};
                        }

                        // Dropdown values are JSON encoded and prefixed, as Blockly only allows for string values
                        return { ...opt, value: FlowBlockLayout.serializeValue(opt.value) };
                    })
                };
            })
        } as IFlowBlockLayoutSerialized;
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