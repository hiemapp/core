import { ExtensionModuleConfig, ExtensionModuleFactory } from '../extensions/ExtensionModule';
import type { FlowBlockCategoryManifest } from './FlowBlockCategory.types';

export default class FlowBlockCategory extends ExtensionModuleFactory<FlowBlockCategoryManifest>() {
    static extensionModuleConfig: ExtensionModuleConfig = {
        manifestRequired: true
    }
}
