import ExtensionModule, { TExtensionModule } from '~/extensions/ExtensionModule';
import Connector from './Connector';

export interface TConectorProtocol extends TExtensionModule {
    events: {
        'data:send': [ Connector, unknown ],
        'data:receive': [ Connector, unknown ],
        'connectors:add': [ Connector ]
    }
}

export default class ConnectorProtocol<TData extends {} = {}> extends ExtensionModule<TConectorProtocol, TData> {

}
