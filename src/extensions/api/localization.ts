import LanguageProvider, { type LanguageKey, type NestedMessagesMap } from '~/localization/LanguageProvider';
import { flattenKeys } from '~/utils/object';
import { registerModule } from './registry';

export function registerMessages(key: LanguageKey, messages: NestedMessagesMap) {
    return registerModule(key, () => {
        return class extends LanguageProvider {
            static init() {
                this.defineManifest({
                    messages: flattenKeys(messages)
                });
            }
        }
    })
}