import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import LanguageController from './LanguageController';
import { LanguageKey, MessagesMap } from './LanguageMessages';
import _ from 'lodash';

export interface LanguageProps {
    id: LanguageKey,
    messages: MessagesMap;
}

export interface LanguagePropsSerialized extends LanguageProps {
    messages: Record<string, string>
}

export default class Language extends ModelWithProps<LanguageProps, LanguagePropsSerialized> {
    _getConfig(): ModelWithPropsConfig<LanguageProps, LanguagePropsSerialized> {
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

    addMessages(messages: MessagesMap, prefix: string): void {
        let prefixedMessages: Record<string, any> = {};

        _.forOwn(messages, (message, id) => {
            prefixedMessages[prefix ? `${prefix}.${id}` : id] = message;
        });

        this.setProp('messages', Object.assign({}, this.getProp('messages'), prefixedMessages));
    }
}
