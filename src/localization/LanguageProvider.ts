import { ExtensionModuleFactory, ExtensionModuleConfig } from '../extensions/ExtensionModule';

export type LanguageKey = 'nl-nl' | 'en-us';

export type MessagesMap = Record<string, string>;
export type NestedMessagesMap = {
    [key: string]: NestedMessagesMap | string
};

export interface LanguageProviderManifest {
    messages: MessagesMap;
}

export default class LanguageProvider extends ExtensionModuleFactory<LanguageProviderManifest>() {
    map: MessagesMap;

    static extensionModuleConfig: ExtensionModuleConfig = {
        manifestRequired: true
    }
}
