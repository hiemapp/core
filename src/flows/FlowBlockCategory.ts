import ExtensionModule from '../extensions/ExtensionModule';
import type { FlowBlockCategoryManifest } from './FlowBlockCategory.types';

export default class FlowBlockCategory extends ExtensionModule {
    getManifest(): FlowBlockCategoryManifest {
        return {};
    }
}
