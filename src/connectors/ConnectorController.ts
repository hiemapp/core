import ControllerDatabase from '../lib/ControllerDatabase';
import Connector from './Connector';

export default class ConnectorController extends ControllerDatabase<Connector>() {
    static table = 'connectors';

    static load() {
        return super.load(Connector);
    }
}
