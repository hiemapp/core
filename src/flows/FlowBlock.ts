import ExtensionModule from '../extensions/ExtensionModule';
import { FlowBlockManifest, FlowBlockTask } from 'types';
import type FlowBlockContext from './FlowBlockContext/FlowBlockContext';

export default class FlowBlock extends ExtensionModule {
    constructor() {
        super();
    }

    async run(ctx: FlowBlockContext): Promise<any> {
        return;
    }

    reload(ctx: FlowBlockContext): void {
        
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
