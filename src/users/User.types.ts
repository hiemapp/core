import { ModelWithPropsType } from '~/lib/ModelWithProps';

export interface UserType extends ModelWithPropsType {
    id: number;
    props: UserProps;
    serializedProps: Omit<UserProps, 'password'>;
}

interface UserProps {
    id: number;
    name: string | null;
    username: string;
    permissions: Record<string, boolean>;
    settings: Record<string, any>,
    password: string | null;
}