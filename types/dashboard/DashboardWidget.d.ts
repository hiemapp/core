import type { Color } from '~/utils/style/colors';
import type { Icon } from '~/utils/icons';
import type { AnyElement } from '~/ui/types';

export interface DashboardWidgetManifest {
    title: string;
    color: Color;
    icon: Icon;
}

export type DashboardWidgetContent = AnyElement;