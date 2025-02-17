import { Constructor } from '~types/helpers';
import DatabaseController from '../lib/DatabaseController';
import Flow from './Flow';
import FlowBlock from './FlowBlock';
import FlowBlockContext from './FlowBlockContext/FlowBlockContext';

export default class FlowController extends DatabaseController<Flow>() {
    static table = 'flows';

    static load() {
        return super.load(Flow);
    }

    static getBlocksOfType(type: Constructor<FlowBlock>) {
        const blocks: FlowBlockContext[] = [];

        this.index().forEach(flow => {
            flow.getBlocks().forEach(blockCtx => {
                blocks.push(blockCtx);
            })
        })

        return blocks;
    }
}
