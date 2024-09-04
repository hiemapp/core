import ExtensionModule, { TExtensionModule } from '~/extensions/ExtensionModule';

export const LANGUAGE_IDS = ['nl_nl', 'en_us'] as const;
export type LanguageId = typeof LANGUAGE_IDS[number];

export type NestedMessages = {
    [key: string]: NestedMessages | string
};

export interface TLanguageMessages extends TExtensionModule {
    methods: TExtensionModule['methods'] & {
        getMessages: () => NestedMessages
    }
}

export default class LanguageMessages extends ExtensionModule<TLanguageMessages> {
    protected _messages: NestedMessages;

    constructor(id: LanguageId, messages: NestedMessages) {
        super(id);

        this._messages = messages;
        
        this.$module.methods = {
            ...this.$module.methods,
            getMessages: () => this._messages
        }
    }
}