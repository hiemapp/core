import { LanguageId, NestedMessages } from './LanguageMessages';

export interface LanguageType {
    id: LanguageId,
    events: {}
}

interface LanguageProps {
    id: LanguageId,
    messages: NestedMessages;
}

interface LanguagePropsSerialized extends LanguageProps {
    messages: Record<string, string>
}
