import ExtensionModule from '../extensions/ExtensionModule';
import type { FlowBlockCategoryManifest } from '~types';

export default class FlowBlockCategory extends ExtensionModule {
    getManifest(): FlowBlockCategoryManifest {
        return {};
    }
}
