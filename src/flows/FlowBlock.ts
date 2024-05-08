import { ExtensionModuleFactory, ExtensionModuleConfig } from '../extensions/ExtensionModule';
import type { FlowBlockManifest } from './FlowBlockManifest.types';
import type { FlowBlockLayout } from './FlowBlockLayout.types';
import type { FlowBlockTask } from './FlowBlockTask.types';
import type FlowBlockContext from './FlowBlockContext/FlowBlockContext';

export default class FlowBlock extends ExtensionModuleFactory<FlowBlockManifest>(){
    private static __layoutProvider: () => FlowBlockLayout = () => { return {}; };

    static extensionModuleConfig: ExtensionModuleConfig = {
        manifestRequired: true
    }

    static defineLayoutProvider(layoutProvider: () => FlowBlockLayout) {
        this.__layoutProvider = layoutProvider;
    }

    async run(ctx: FlowBlockContext): Promise<any> {
        return;
    }

    async mount(ctx: FlowBlockContext): Promise<void> {
        return;
    }

    async unmount(ctx: FlowBlockContext): Promise<void> {
        return;
    }

    handleTask(task: FlowBlockTask, ctx: FlowBlockContext): void {
        return;
    }

    static validate(): void {
        super.validate();

        if(!this.__layoutProvider) {
            throw new Error('No layoutProvider was defined.');
        }
    }

    
    static layout() {
        return this.__layoutProvider();
    }
}
