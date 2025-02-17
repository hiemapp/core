import DatabaseController from '../lib/DatabaseController';
import Script from './Script';

export default class ScriptController extends DatabaseController<Script>() {
    static table = 'scripts';

    static load() {
        return super.load(Script);
    }
}
