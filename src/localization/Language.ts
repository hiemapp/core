import ModelWithProps, { ModelWithPropsConfig } from '../lib/ModelWithProps';
import LanguageController from './LanguageController';
import { LanguageId, NestedMessages } from './LanguageMessages';
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

    constructor(key: LanguageId) {
        super(key, {
            messages: {},
        });
    }

    addMessages(messages: NestedMessages, scope: string): void {
        let scopedMessages: Record<string, any> = {};

        _.forOwn(messages, (message, id) => {
            // If the id is prefixed with an '@', ignore the scope 
            if (!id.startsWith('@') && scope) {
                id = `${scope}.${id}`;
            }

            scopedMessages[id] = message;
        });

        this.setProp('messages', Object.assign({}, this.getProp('messages'), scopedMessages));
    }
}
