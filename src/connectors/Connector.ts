import ModelWithProps, { InferSchema } from '~/lib/ModelWithProps';
import ConnectorProtocol from './ConnectorProtocol';
import ConnectorController from './ConnectorController';
import { ExtensionController } from '~/extensions';
import _ from 'lodash';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

export type ProtocolConfig = {
    type: string|null;
    options: Record<string, any>
};

export interface ConnectorType {
    id: number;
    events: {
        'connect': void,
        'disconnect': void,
        'data': {
            getString: () => string,
            getRaw: () => unknown,
            getJSON: () => unknown
        }
    }
}

export default class Connector extends ModelWithProps<ConnectorType> {
    protected $schema = z.object({
        protocol: z.object({
            type: z.string().nullable(),
            options: z.record(z.string(), z.any())
        })
    })

    public protocol: ConnectorProtocol;

    protected _protocolConfig: InferSchema<Connector>['protocol']|null = null;
    protected _isConnected: boolean = false;
    /**
     * Check if the connector has been initialized yet.
     * @returns Whether the connector has been initialized yet.
     */
    isInitialized() {
        return !!this.protocol;
    }

    /**
     * Set the protocol config for the connector to use. This can only be done once.
     * @returns Whether the initialization was succesful.
     */
    initialize(protocolConfig: ProtocolConfig|null): boolean {
        if(this.isInitialized()) return false;
        if(typeof protocolConfig?.type !== 'string') return true;

        this.protocol = ExtensionController.findModule(ConnectorProtocol, protocolConfig.type) as ConnectorProtocol;
        this._protocolConfig = protocolConfig;

        this.protocol.emit('connectors:add', this);
        return true;
    }

    isConnected() { return this._isConnected; }
    setConnected(isConnected: boolean) {
        isConnected = !!isConnected;
        if(this._isConnected === isConnected) return;

        this._isConnected = isConnected;

        this.emit(this.isConnected() ? 'connect' : 'disconnect', undefined);
    }

    getProtocolType() {
        return this._protocolConfig!.type;
    }

    getProtocolOptions() {
        return this._protocolConfig!.options;
    }

    validateProtocolOption(keypath: string, callback: (value: any) => unknown, isOptional: boolean = false) {
        const value = _.get(this.getProtocolOptions(), keypath);
        if(isOptional && (typeof value === 'undefined' || value === null)) return true;
        if(callback(value)) return true;
        
        throw new Error(`Invalid value for option '${keypath}': ${value}.`);
    }

    send(data: unknown) {
        this.protocol.emit('data:send', this, data);
    }

    receive(data: unknown) {
        const getRaw = () => data;
        const getString = () => data+'';
        const getJSON = () => {
            try {
                return JSON.parse(data+'');
            } catch(err) {
                return {};
            }
        };

        this.emit('data', { getRaw, getString, getJSON });
    }
}