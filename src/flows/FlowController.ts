import ControllerDatabase from '../lib/ControllerDatabase';
import Flow from './Flow';

export default class FlowController extends ControllerDatabase<Flow>() {
    static table = 'flows';

    static load() {
        return super.load(Flow);
    }
}
