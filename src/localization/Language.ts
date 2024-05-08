import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import LanguageController from './LanguageController';
import { LanguageKey, MessagesMap } from './LanguageProvider';
import _ from 'lodash';
import { LanguageType } from './Language.types';

export default class Language extends ModelWithProps<LanguageType> {
    __modelConfig(): ModelWithPropsConfig<LanguageType> {
        return {
            controller: LanguageController,
            defaults: {
                messages: {}
            }
        }
    };

    constructor(key: LanguageKey) {
        super(key, {
            messages: {},
        });
    }

    addMessages(messages: MessagesMap, scope: string): void {
        let scopedMessages: Record<string, any> = {};

        _.forOwn(messages, (message, id) => {
            // If the id does not have an '@global' prefix, limit it to the `scope`.
            if (!id.startsWith('@global')) {
                id = `${scope}.${id}`;
            }

            scopedMessages[id] = message;
        });

        this.setProp('messages', Object.assign({}, this.getProp('messages'), scopedMessages));
    }
}
