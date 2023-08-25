import { ExtensionModuleFactory, ExtensionModuleConfig } from '../extensions/ExtensionModule';
import type { FlowBlockManifest } from './FlowBlockManifest.types';
import type { FlowBlockLayout } from './FlowBlockLayout.types';
import type { FlowBlockTask } from './FlowBlockTask.types';
import type FlowBlockContext from './FlowBlockContext/FlowBlockContext';

export default class FlowBlock extends ExtensionModuleFactory<FlowBlockManifest>(){
    private static __layoutProvider: () => FlowBlockLayout;

    static extensionModuleConfig: ExtensionModuleConfig = {
        manifestRequired: true
    }

    static defineLayoutProvider(layoutProvider: () => FlowBlockLayout) {
        this.__layoutProvider = layoutProvider;
    }

    async run(block: FlowBlockContext): Promise<any> {
        return;
    }

    async mount(block: FlowBlockContext): Promise<void> {
        return;
    }

    handleTask(task: FlowBlockTask, block: FlowBlockContext): void {
        return;
    }

    static checkValidity(): void {
        super.checkValidity();

        if(!this.__layoutProvider) {
            throw new Error('No layoutProvider was defined.');
        }
    }

    
    static layout() {
        return this.__layoutProvider();
    }
}
