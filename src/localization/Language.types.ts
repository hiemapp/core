import { ModelWithPropsType } from '~/lib/ModelWithProps';
import { LanguageKey, MessagesMap } from './LanguageProvider';

export interface LanguageType extends ModelWithPropsType {
    id: LanguageKey,
    props: LanguageProps,
    serializedProps: LanguagePropsSerialized
}

interface LanguageProps {
    id: LanguageKey,
    messages: MessagesMap;
}

interface LanguagePropsSerialized extends LanguageProps {
    messages: Record<string, string>
}
