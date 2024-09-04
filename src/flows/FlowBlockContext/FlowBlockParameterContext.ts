import type { IFlowBlockLayout_parameter } from '~/flows/FlowBlockLayout.types'
import type { FlowBlockParameterDef } from '~/flows/FlowBlockDef.types';
import FlowBlockInputContext from './FlowBlockInputContext';
import { DeviceController } from '~/devices';
import { FlowController } from '~/flows';
import { UserController } from '~/users';
import { ExtensionController } from '~/extensions';
import FlowBlockContextExecutable from './FlowBlockContext';

export default class FlowBlockParameterContext extends FlowBlockInputContext<FlowBlockParameterDef, IFlowBlockLayout_parameter> {
    async value() {
        return new Promise<any>(async (resolve, reject) => {
            if(typeof this.def.value.constant !== 'undefined') {
                const value = this.formatValue(this.def.value.constant);
                return resolve(value);
            }

            if(typeof this.def.value.block === 'string' && this.blockCtx instanceof FlowBlockContextExecutable) {
                const block = this.blockCtx.flowCtx.getBlock(this.def.value.block);

                const value = await block.execute();
                return resolve(value);
            }

            return resolve(null);
        })
    }

    formatValue(value: any) {
        return FlowBlockParameterContext.formatValue(value, this.layout);
    }

    static formatValue(value: any, layout: IFlowBlockLayout_parameter) {
        if(typeof value === 'undefined' || value === null) return null;

        // Create list of allowed types
        const allowedTypes = Array.isArray(layout.type) ? layout.type : [ layout.type ];

        let currentType: string = typeof value;
        if(currentType === 'object' && value instanceof Date) {
            currentType = 'date';
        }

        // Don't modify the value if the current type matches the parameter type.
        if (allowedTypes.includes(currentType as any)) {
            return value;
        }

        // If the value type does not match the parameter type,
        // parse the value to be the required type.
        switch(allowedTypes[0]) {
            case 'number':
                return parseFloat(value);
            case 'string':
                if(typeof value == 'undefined' || value === null) return null;
                return (typeof value.toString === 'function' ? value.toString() : value+'');
            case 'boolean':
                if(value == 'true') return true;
                if(value == 'false') return false;
                return !!value;
            case 'date':
                return (value instanceof Date ? value : new Date(value));
            case 'device':
                return DeviceController.find(value);
            case 'flow':
                return FlowController.find(value);
            case 'user':
                return UserController.find(value);
            case 'extension':
                return ExtensionController.find(value);
        }
    }

    protected findManifest() {
        const manifest = this.blockCtx.manifest.getArr('parameters').find(p => p.id === this.id);
        if(!manifest) {
            throw new Error(`Manifest for parameter '${this.id}' not found.`);
        }
        return manifest;
    }

    protected findDef() {
        const def = this.blockCtx.def.parameters.find(p => p.id === this.id);
        if(!def) {
            throw new Error(`Definition for parameter '${this.id}' not found.`);
        }
        return def;
    }
}