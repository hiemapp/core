import { DashboardWidgetListener } from '~/dashboard/DashboardWidget/DashboardWidget';
import type { Color } from '~/utils/style/colors';
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
    listeners?: Record<string, DashboardWidgetListener | undefined>
}

type StylePropertyValue = 'auto' | 'inherit' | 'unset' | string;
type StyleProperties = {
    margin: StylePropertyValue;
    marginTop: StylePropertyValue;
    marginRight: StylePropertyValue;
    marginBottom: StylePropertyValue;
    marginLeft: StylePropertyValue;
    padding: StylePropertyValue;
    paddingTop: StylePropertyValue;
    paddingRight: StylePropertyValue;
    paddingBottom: StylePropertyValue;
    paddingLeft: StylePropertyValue;
    color: StylePropertyValue;
    backgroundColor: StylePropertyValue;
    fontSize: string;
    [key: string]: string;
}
export type WrapperProps<TProps> = TProps & { 
    className?: string;
    style?: Partial<StyleProperties>;
    children?: ValidNode[];
};

export type RenderProps<TProps> = TProps & {
    children?: ValidNode[];
    className?: string;
}