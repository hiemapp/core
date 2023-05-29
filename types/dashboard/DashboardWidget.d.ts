import { Color } from '~/utils/colors';
import { Icon } from '~/utils/icons';

export interface DashboardWidgetManifest {
    title: string;
    color: Color;
    icon: Icon;
}

export interface SerializedNode {
    text?: string;
    id?: number;
    tag?: string;
    attributes?: Record<string, any>;
    children?: SerializedNode[],
    events?: string[]
}

export type WrapperProps<TProps> = TProps & { 
    className?: string
};

export type RenderProps<TProps> = TProps & {
    className?: string
    children: ValidNode[],
}