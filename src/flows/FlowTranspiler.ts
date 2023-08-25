import { forOwn } from 'lodash';
import type { FlowBlocklyWorkspace, FlowBlocklyWorkspaceBlock, FlowScript, FlowScriptBlock } from './Flow.types';
import ExtensionController from '../extensions/ExtensionController';
import FlowBlock from './FlowBlock';
import { logger } from '../lib';
import Manifest from '~/utils/Manifest';

type FlowBlocklyWorkspaceBlockInput = FlowBlocklyWorkspaceBlock['inputs'][number];

export default class FlowTranspiler {
    script: FlowScript = { blocks: [] };

    transpileWorkspace(bwpc: FlowBlocklyWorkspace): FlowScript {
        this.script = { blocks: [] };

        bwpc.blocks.forEach(block => {
            this.storeAndTranspileBlock(block, null);
        })

        return this.script;
    }

    protected transpileInputValue(input: FlowBlocklyWorkspaceBlockInput, parent: FlowBlocklyWorkspaceBlock) {
        if(input.block) {
            this.storeAndTranspileBlock(input.block, parent);
            return { block: input.block.id };
        }

        if(input.shadow && !input.shadow.type.startsWith('__type_')) {
            this.storeAndTranspileBlock({ ...input.shadow, inputs: {} }, parent);
            return { block: input.shadow.id };
        }

        return { block: null };
    }

    protected transpileChildren(input: FlowBlocklyWorkspaceBlockInput, parent: FlowBlocklyWorkspaceBlock): string[] {
        const ids: string[] = [];

        let currentBlock: FlowBlocklyWorkspaceBlock | undefined = input.block;
        while(currentBlock) {
            ids.push(currentBlock.id);
            this.storeAndTranspileBlock(currentBlock, parent);

            currentBlock = currentBlock.next?.block;
        }

        return ids;
    }

    protected storeAndTranspileBlock(block: FlowBlocklyWorkspaceBlock, parent: FlowBlocklyWorkspaceBlock | null) {
        const type = ExtensionController.findModuleOrFail(FlowBlock, block.type);
        if(!type) {
            logger.warn(`Flow block type '${block.type}' not found.`);
            return;
        }
        const layout = new Manifest(type.layout());
        const blockDef: FlowScriptBlock = {
            id: block.id,
            type: block.type,
            parameters: [],
            statements: [],
            parent: { 
                id: parent?.id ?? '__ROOT__' 
            }
        };

        if(block.inputs) {
            forOwn(block.inputs, (input, id) => {
                const statement = layout.getArr('statements').find(s => s.id.toUpperCase() === id.toUpperCase());
                if(statement) {
                    const childrenIds = this.transpileChildren(input, block);
                    blockDef.statements.push({
                        id: id,
                        children: childrenIds
                    })
                    return true;
                }

                const parameter = layout.getArr('parameters').find(p => p.id.toUpperCase() === id.toUpperCase());
                if(parameter) {
                    const value = this.transpileInputValue(input, block);
                    blockDef.parameters.push({ id, value });
                }
            })
        }

        if(block.fields) {
            forOwn(block.fields, (value, id) => {
                const parameter = layout.getArr('parameters').find(p => p.id.toUpperCase() === id.toUpperCase());
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

        this.script.blocks.push(blockDef);
    }
}