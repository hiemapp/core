import type { Icon } from '~/utils/icons';
import type { Color } from '~/utils/colors';

export interface FlowBlockCategoryManifest {
    icon?: Icon;
    color?: Color | number;
    customColors?: {
        main?: string;
        shadow?: string;
        border?: string;
    };
    priority?: number;
}
