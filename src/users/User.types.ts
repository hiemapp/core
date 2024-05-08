import { ModelWithPropsType } from '~/lib/ModelWithProps';

export interface UserType extends ModelWithPropsType {
    id: number;
    props: UserProps;
    serializedProps: UserProps;
}

interface UserProps {
    id: number;
    name: string;
    permissions: Record<string, boolean>;
    settings: Record<string, any>,
    password: string | null;
}