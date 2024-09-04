import { forOwn } from 'lodash';
import type { FlowDef } from './Flow.types';
import Flow from './Flow';
import { FlowBlockDef } from './FlowBlockDef.types';
import ExtensionController from '../extensions/ExtensionController';
import FlowBlock from './FlowBlock';
import { logger } from '../lib';
import { FlowBlockContext, FlowBlockLayout, FlowContext } from '~/flows';
import Manifest from '~/utils/Manifest';

export interface BlocklySerializedWorkspace {
    languageVersion: number;
    blocks: BlocklyBlock[];
}

export interface BlocklyBlock {
    type: string;
    id: string;
    inputs: Record<string, BlocklyBlockInput>;
    fields?: Record<string, any>
    next?: {
        block: BlocklyBlock;
    };
}

export interface BlocklyBlockInput {
    shadow?: {
        type: string;
        id: string;
        fields?: {
            [id: string]: any;
        };
    };
    block?: BlocklyBlock;
}

export default class BlocklyTranspiler {
    protected def: FlowDef;

    createContext(flow: Flow, state: BlocklySerializedWorkspace) {
        const def = this.transpileWorkspace(state);
        const blocks: Record<string, FlowBlockContext> = {};

        // Create flow context
        const flowCtx = new FlowContext(flow, def, blocks);

        // Create context for each block
        def.blocks.forEach(block => {
            blocks[block.id] = new FlowBlockContext(block.id, flowCtx)
        })

        return { flow: flowCtx, blocks };
    }

    transpileWorkspace(state: BlocklySerializedWorkspace): FlowDef {
        this.def = { blocks: [] };

        if(Array.isArray(state.blocks)) {
            state.blocks.forEach(block => {
                this.transpileBlockNextTree(block);
            })
        }

        return this.def;
    }

    transpileBlock(block: BlocklyBlock, parent?: BlocklyBlock) {
        const type = ExtensionController.findModuleOrFail(FlowBlock, block.type);
        if(!type) {
            logger.warn(`Flow block type '${block.type}' not found.`);
            return;
        }
        const layout = type.$module.methods.getLayout();
        const blockDef: FlowBlockDef = {
            id: block.id,
            type: block.type,
            parameters: [],
            statements: [],
            parent: { 
                id: parent?.id ?? '__ROOT__' 
            }
        };

        if(block.inputs) {
           this.transpileBlockInputs(block, blockDef, layout);
        }

        if(block.fields) {
            this.transpileBlockFields(block, blockDef, layout); 
        }

        this.def.blocks.push(blockDef);
    }

    protected transpileBlockNextTree(block: BlocklyBlock, parent?: BlocklyBlock) {
        const blockIds: string[] = [];
        
        let currentBlock: BlocklyBlock|undefined = block;
        while(currentBlock) {
            this.transpileBlock(currentBlock, parent);
            blockIds.push(currentBlock.id);

            currentBlock = currentBlock.next?.block;
        }

        return blockIds;
    }

    protected transpileBlockInputs(block: BlocklyBlock, blockDef: FlowBlockDef, layout: FlowBlockLayout) {       
        forOwn(block.inputs, (input, id) => {
            if(input.block) {
                const statement = layout.getStatementOrFail(id);
                if(statement) {
                    const childrenIds = this.transpileBlockNextTree(input.block, block);
                    blockDef.statements.push({
                        id: id,
                        children: childrenIds
                    })
                    return true;
                }
            }

            const parameter = layout.getParameterOrFail(id);
            if(parameter) {
                const value = this.transpileBlockInputValue(input, block);
                blockDef.parameters.push({ id, value });
            }
        })
    }

      protected transpileBlockInputValue(input: BlocklyBlockInput, parent: BlocklyBlock) {
        if(input.block) {
            this.transpileBlock(input.block, parent);
            return { block: input.block.id };
        }

        if(input.shadow && !input.shadow.type.startsWith('__type_')) {
            this.transpileBlock({ ...input.shadow, inputs: {} }, parent);
            return { block: input.shadow.id };
        }

        return { block: null };
    }

    protected transpileBlockFields(block: BlocklyBlock, blockDef: FlowBlockDef, layout: FlowBlockLayout) {
        forOwn(block.fields, (value, id) => {
            const parameter = layout.getParameterOrFail(id);
            if(parameter) {
                blockDef.parameters.push({ 
                    id, 
                    value: { 
                        constant: value
                    }
                });
            } else {
                logger.warn(`Parameter '${id}' in block '${block.id}' is specified, but not defined in the manifest.`);
            }
        })
    }
}