import Extension from '../extensions/Extension';
import ExtensionController from '../extensions/ExtensionController';
import Controller from '../lib/Controller';
import LanguageProvider, { LanguageKey } from './LanguageProvider';
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
                const provider = extension.getModuleOrFail(LanguageProvider, key);
                if (!provider) return true;

                language.addMessages(provider.manifest.get('messages'), extension.getId());
            });

            languages[key] = language;
        });

        this.store(languages);
    }
}
