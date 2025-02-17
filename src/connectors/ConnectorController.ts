import DatabaseController from '../lib/DatabaseController';
import Connector from './Connector';

export default class ConnectorController extends DatabaseController<Connector>() {
    static table = 'connectors';

    static load() {
        return super.load(Connector);
    }
}
