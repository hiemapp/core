import { ModelWithPropsType } from '~/lib/ModelWithProps';
import { LanguageId, NestedMessages } from './LanguageMessages';

export interface LanguageType extends ModelWithPropsType {
    id: LanguageId,
    props: LanguageProps,
    serializedProps: LanguagePropsSerialized
}

interface LanguageProps {
    id: LanguageId,
    messages: NestedMessages;
}

interface LanguagePropsSerialized extends LanguageProps {
    messages: Record<string, string>
}
