import { Constructor } from '~types/helpers';
import ControllerDatabase from '../lib/ControllerDatabase';
import Script from './Script';

export default class ScriptController extends ControllerDatabase<Script>() {
    static table = 'scripts';

    static load() {
        return super.load(Script);
    }
}
