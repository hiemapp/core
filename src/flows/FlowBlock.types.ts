import { FlowblockContextHandlerName } from './FlowBlockContext/FlowBlockContext';
import { IFlowBlockLayout } from './FlowBlockLayout.types';
import { FlowTaskData } from './Flow.types';
import { TExtensionModule } from '~/extensions/ExtensionModule';

export interface TFlowBlockModule extends TExtensionModule {
    providers: TExtensionModule['providers'] & {
        manifest: () => IFlowBlockManifest;
        layout: () => IFlowBlockLayout
    }
}

export interface IFlowBlockManifest {
    icon?: string;
    category: string;
    registersHandlers?: FlowblockContextHandlerName[];
    invokesHandlers?: FlowblockContextHandlerName[];
    localeScope?: string;
}

export interface FlowBlockCustomTaskData<TOriginalData = any> extends FlowTaskData {
    originalKeyword: string;
    originalData?: TOriginalData
}
