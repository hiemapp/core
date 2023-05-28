import ExtensionModule from '../extensions/ExtensionModule';

export type LanguageKey = 'nl-nl' | 'en-us';

export type MessagesMap = Record<string, string>;
export type NestedMessagesMap = {
    [key: string]: NestedMessagesMap | string
};

export default class LanguageMessages extends ExtensionModule {
    static map: MessagesMap;
}
