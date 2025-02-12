import ModelWithProps, { ModelWithPropsConfig, ModelWithPropsType } from '~/lib/ModelWithProps';
import ConnectorProtocol from './ConnectorProtocol';
import ConnectorController from './ConnectorController';
import { ExtensionController } from '~/extensions';
import _ from 'lodash';

export type ProtocolConfig = {
    type: string|null;
    options: Record<string, any>
};

export interface ConnectorType extends ModelWithPropsType {
    id: number;
    props: {
        protocol: ProtocolConfig|null
    },
    events: {
        'ready': void,
        'stop': void,
        'data': {
            getString: () => string,
            getRaw: () => unknown,
            getJSON: () => unknown
        }
    }
}

export default class Connector extends ModelWithProps<ConnectorType> {
    public protocol: ConnectorProtocol;

    protected _protocolConfig: ConnectorType['props']['protocol']|null = null;
    protected _isReady: boolean = false;

    __modelConfig(): ModelWithPropsConfig<ConnectorType> {
        return {
            controller: ConnectorController,
            defaults: {
                protocol: null
            }
        }
    }

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

    isReady() { return this._isReady; }
    setReady(isReady: boolean) {
        isReady = !!isReady;
        if(this._isReady === isReady) return;

        this._isReady = isReady;

        this.emit(this.isReady() ? 'ready' : 'stop', undefined);
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

    async send(data: unknown) {
        this.protocol.emit('data:send', this, data);
    }

    async receive(data: unknown) {
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