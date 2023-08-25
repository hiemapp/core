import { ExtensionModuleFactory, ExtensionModuleConfig } from '../extensions/ExtensionModule';

export type LanguageKey = 'nl-nl' | 'en-us';

export type MessagesMap = Record<string, string>;
export type NestedMessagesMap = {
    [key: string]: NestedMessagesMap | string
};

export interface LanguageMessagesManifest {
    messages: MessagesMap;
}

export default class LanguageMessages extends ExtensionModuleFactory<LanguageMessagesManifest>() {
    map: MessagesMap;

    static __extensionModuleConfig: ExtensionModuleConfig = {
        manifestRequired: true
    }
}
