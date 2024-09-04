import Extension from '../extensions/Extension';
import ExtensionController from '../extensions/ExtensionController';
import Controller from '../lib/Controller';
import LanguageMessages, { LANGUAGE_IDS } from './LanguageMessages';
import Language from './Language';
import * as _ from 'lodash';
import Locale from './Language';

export default class LanguageController extends Controller<Language>() {
    static load() {
        let languages: Record<string, Language> = {};

        LANGUAGE_IDS.forEach(id => {
            const language = new Language(id);

            ExtensionController.index().forEach(ext => {
                const messages = ext.getModuleOrFail(LanguageMessages, id);
                if (!messages) return true;

                const scope = ext.id;
                language.addMessages(messages.$module.methods.getMessages(), scope);
            });

            languages[id] = language;
        });

        this.store(languages);
    }
}
