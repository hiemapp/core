import ModelWithProps, { ModelWithPropsConfig, ModelWithPropsType } from '~/lib/ModelWithProps';
import ConnectorProtocol from './ConnectorProtocol';
import ConnectorController from './ConnectorController';
import { ExtensionController } from '~/extensions';

export interface ConnectorType extends ModelWithPropsType {
    id: number;
    props: {
        protocol: {
            type: string|null;
            options: Record<string, any>
        }
    },
    events: {
        'ready': void,
        'stop': void,
        'data:receive': {
            getString: () => string,
            getRaw: () => unknown,
            getJSON: () => unknown
        }
    }
}

export default class Connector extends ModelWithProps<ConnectorType> {
    protected protocol: ConnectorProtocol;

    protected _isReady: boolean = false;

    __modelConfig(): ModelWithPropsConfig<ConnectorType> {
        return {
            controller: ConnectorController,
            defaults: {
                protocol: {
                    type: null,
                    options: {}
                }
            }
        }
    }

    async __init() {
        try {
            const { type } = this.getProp('protocol');
            if(typeof type !== 'string') return;

            const protocol = ExtensionController.findModule(ConnectorProtocol, type) as ConnectorProtocol;
            this.protocol = protocol;

            protocol.emit('connectors:add', this);
        } catch(err) {
            this.logger.error(err);
        }
    }

    isReady() { return this._isReady; }
    setReady(isReady: boolean) {
        isReady = !!isReady;
        if(this._isReady === isReady) return;

        this._isReady = isReady;

        this.emit(this.isReady() ? 'ready' : 'stop', undefined);
    }

    getProtocolConfig() {
        return this.getProp('protocol');
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

        this.emit('data:receive', { getRaw, getString, getJSON });
    }
}