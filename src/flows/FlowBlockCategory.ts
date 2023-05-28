import ExtensionModule from '../extensions/ExtensionModule';
import type { FlowBlockCategoryManifest } from '~types';
import colors from '~/utils/colors';

export default class FlowBlockCategory extends ExtensionModule {
    getManifest(): FlowBlockCategoryManifest {
        return {};
    }
}
