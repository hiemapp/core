import ExtensionModule from '../extensions/ExtensionModule';
import type { FlowBlockManifest } from './FlowBlockManifest.types';
import type { FlowBlockTask } from './FlowBlockTask.types';
import type FlowBlockContext from './FlowBlockContext/FlowBlockContext';

export default class FlowBlock extends ExtensionModule {
    constructor() {
        super();
    }

    async run(ctx: FlowBlockContext): Promise<any> {
        return;
    }

    handleMount(ctx: FlowBlockContext): void {
        
    }

    handleTask(task: FlowBlockTask, ctx: FlowBlockContext): void {
        return;
    }

    getManifest(): FlowBlockManifest {
        return {
            category: ''
        };
    }
}
