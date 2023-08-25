import { FlowBlockLayout } from './FlowBlockLayout.types';

export interface FlowBlockManifest {
    icon?: string;
    category: string;
}

export interface FlowBlockManifestSerialized extends FlowBlockManifest {
    layout: FlowBlockLayout
}
