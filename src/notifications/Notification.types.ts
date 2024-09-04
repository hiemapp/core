import type { ModelWithPropsType } from '~/lib/ModelWithProps';
import ModelWithProps from '~/lib/ModelWithProps';
import type { Icon, Palette } from '~/ui';


export interface NotificationProps {
    palette: Palette | null,
    icon: Icon | null,
    level: 'info' | 'error' | 'warning' | 'notice',
    message: string | number | boolean | undefined | null | { 
        id: string, 
        values?: Record<string, any>,
        ctx?: Record<string, ModelWithProps<any>>
    }
}

export interface NotificationType extends ModelWithPropsType {
    id: string;
    props: NotificationProps,
    serializedProps: NotificationProps
}