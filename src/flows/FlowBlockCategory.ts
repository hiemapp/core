import ExtensionModule, { TExtensionModule } from '../extensions/ExtensionModule';
import type { FlowBlockCategoryManifest } from './FlowBlockCategory.types';

export interface TFlowBlockCategory extends TExtensionModule {
    providers: TExtensionModule['providers'] & {
        manifest: () => FlowBlockCategoryManifest
    }
}

export default class FlowBlockCategory extends ExtensionModule<TFlowBlockCategory> {

}
