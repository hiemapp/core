import { Color } from '~/utils/style/colors';
import { Icon } from '~/utils';

export interface DashboardWidgetManifest {
    title: string;
    color: Color;
    icon: Icon;
}