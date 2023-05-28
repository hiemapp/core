import Extension from '../extensions/Extension';
import ExtensionController from '../extensions/ExtensionController';
import Controller from '../lib/Controller';
import LanguageMessages, { LanguageKey } from './LanguageMessages';
import Language from './Language';
import * as _ from 'lodash';
import Locale from './Language';

const AVAILABLE_LANGUAGES: LanguageKey[] = ['nl-nl', 'en-us'];

export default class LanguageController extends Controller<Language>() {
    static load() {
        let languages: Record<string, Language> = {};

        AVAILABLE_LANGUAGES.forEach((key) => {
            const language = new Language(key);

            ExtensionController.index().forEach((extension: Extension) => {
                const messages = extension.getModuleOrFail(LanguageMessages, key);
                if (!messages) return true;

                language.addMessages(messages.map, extension.getId());
            });

            languages[key] = language;
        });

        this.store(languages);
    }
}
