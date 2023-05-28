import LanguageMessages, { type LanguageKey, type NestedMessagesMap } from '~/localization/LanguageMessages';
import { flattenKeys } from '~/utils/object';
import { registerModule } from './registry';

export function registerMessages(key: LanguageKey, messages: NestedMessagesMap) {
    return registerModule(key, () => {
        return class extends LanguageMessages {
            static map = flattenKeys(messages);
        }
    })
}