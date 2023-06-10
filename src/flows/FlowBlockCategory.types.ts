import type { Icon } from '~/utils/icons';
import type { Color } from '~/utils/style/colors';

export interface FlowBlockCategoryManifest {
    icon?: Icon;
    color?: Color;
    customColors?: {
        main?: string;
        shadow?: string;
        border?: string;
    };
    priority?: number;
}