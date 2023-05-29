import ExtensionModule from '~/extensions/ExtensionModule';
import icons from '~/utils/icons';
import { DashboardWidgetManifest } from '~types';
import { DashboardWidgetNode } from '~/extensions/api/dashboard';
import colors from '~/utils/colors';

export default class DashboardWidget extends ExtensionModule {
    constructor() {
        super();
    }

    getManifest(): DashboardWidgetManifest {
        return {
            title: 'My widget',
            color: colors.BLUE,
            icon: icons.CIRCLE_QUESTION
        }
    }
    
    render(): DashboardWidgetNode {
        return null;
    }
}