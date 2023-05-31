import { DashboardWidgetListener } from '~/dashboard/DashboardWidget/DashboardWidget';
import { ColorPalette } from '~/utils/colorPalettes';
import { Icon } from '~/utils/icons';

export interface DashboardWidgetManifest {
    title: string;
    accent: ColorPalette;
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

export type WrapperProps<TProps> = TProps & { 
    className?: string;
    style?: Record<string, string | number>;
};

export type RenderProps<TProps> = TProps & {
    className?: string;
    children: ValidNode[];
}