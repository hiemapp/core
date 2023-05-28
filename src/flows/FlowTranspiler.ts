import { forOwn } from 'lodash';
import type { FlowBlocklyWorkspace, FlowBlocklyWorkspaceBlock, FlowScript, FlowScriptBlock } from 'types';
import ExtensionController from '../extensions/ExtensionController';
import FlowBlock from './FlowBlock';
import { logger } from '../lib';

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

        if(input.shadow) {
            this.storeAndTranspileBlock({ ...input.shadow, inputs: {} }, parent);
            return { block: input.shadow.id };
        }

        return { block: null };
    }

    // protected parseFieldValue(value: any, parameterType: FlowBlockManifestParameterType) {
 
    // }

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

    protected storeAndTranspileBlock(block: FlowBlocklyWorkspaceBlock, parent: FlowBlocklyWorkspaceBlock | null): void {
        const type = ExtensionController.findModule(FlowBlock, block.type);
        if(!type) {
            logger.warn(`Flow block type '${block.type}' not found.`);
            return;
        }
        const manifest = type.prototype.getManifest();
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
                if(manifest.statements?.length) {
                    const statement = manifest.statements.find(s => s.id.toUpperCase() === id.toUpperCase());
                    if(statement) {
                        const childrenIds = this.transpileChildren(input, block);
                        blockDef.statements.push({
                            id: id,
                            children: childrenIds
                        })
                        return true;
                    }
                }

                if(manifest.parameters?.length) {
                    const parameter = manifest.parameters.find(p => p.id.toUpperCase() === id.toUpperCase());
                    if(parameter) {
                        const value = this.transpileInputValue(input, block);
                        blockDef.parameters.push({ id, value });
                    }
                }
            })
        }

        if(block.fields) {
            forOwn(block.fields, (value, id) => {
                if(manifest.parameters?.length) {
                    const parameter = manifest.parameters.find(p => p.id.toUpperCase() === id.toUpperCase());
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
                }
            })
        }

        this.script.blocks.push(blockDef);
    }
}