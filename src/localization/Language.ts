import ModelWithProps from '../lib/ModelWithProps';
import { LanguageId, NestedMessages } from './LanguageMessages';
import _ from 'lodash';
import { LanguageType } from './Language.types';
import { z } from 'zod';

export default class Language extends ModelWithProps<LanguageType> {
    protected $schema = z.object({
        messages: z.record(z.string(), z.any())
    })
    
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
