import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import LanguageController from './LanguageController';
import { LanguageKey, MessagesMap } from './LanguageProvider';
import _ from 'lodash';

export interface LanguageProps {
    id: LanguageKey,
    messages: MessagesMap;
}

export interface LanguagePropsSerialized extends LanguageProps {
    messages: Record<string, string>
}

export default class Language extends ModelWithProps<LanguageProps, LanguagePropsSerialized> {
    __modelConfig(): ModelWithPropsConfig<LanguageProps, LanguagePropsSerialized> {
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
