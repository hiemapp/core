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

export interface IFlowBlockFormat {
    inputs: IFlowBlockFormat_input[];
}

export interface IFlowBlockFormat_input {
    id: string;
    type: 'number'|'string'|'time'|'date'|'color'|'device';
    defaultValue?: any;
    primary?: boolean;
    options?: Array<{
        label?: any;
        value: any;
        overrideIcon?: string;
    }>;
}

export interface IFlowBlockManifest {
    icon?: string;
    fieldType: 'trigger' | 'condition' | 'action' | 'output';
    category: string;
    registersHandlers?: FlowblockContextHandlerName[];
    invokesHandlers?: FlowblockContextHandlerName[];
    localeScope?: string;
}

export interface FlowBlockCustomTaskData<TOriginalData = any> extends FlowTaskData {
    originalKeyword: string;
    originalData?: TOriginalData
}
