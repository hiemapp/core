import { FlowblockContextHandlerName } from './FlowBlockContext/FlowBlockContext';
import { FlowBlockLayout } from './FlowBlockLayout.types';

export interface FlowBlockManifest {
    icon?: string;
    category: string;
    registersHandlers?: FlowblockContextHandlerName[],
    invokesHandlers?: FlowblockContextHandlerName[]
}

export interface FlowBlockManifestSerialized extends FlowBlockManifest {
    layout: FlowBlockLayout
}
