import type { FlowScriptBlockParameter } from '~/flows/Flow.types';
import type { FlowBlockLayoutParameter } from '~/flows/FlowBlockLayout.types'
import FlowBlockInputContext from './FlowBlockInputContext';
import { ensureFind } from '~/utils/object';

export default class FlowBlockParameterContext extends FlowBlockInputContext {
    protected layout: FlowBlockLayoutParameter;
    protected def: FlowScriptBlockParameter;

    protected init() {
        this.def = ensureFind(this.blockCtx.def.parameters, p => p.id === this.id);
        this.layout = ensureFind(this.blockCtx.layout.getArr('parameters'), p => p.id === this.id);
    }

    async value() {
        return new Promise<any>(async (resolve, reject) => {
            if(typeof this.def.value.constant !== 'undefined') {
                const value = this.formatValue(this.def.value.constant);
                return resolve(value);
            }

            if(typeof this.def.value.block === 'string') {
                const block = this.blockCtx.flowCtx.findBlock(this.def.value.block);

                const value = await block.execute();
                return resolve(value);
            }

            return resolve(null);
        })
    }

    protected formatValue(value: any) {
       // Create list of allowed types
        const allowedTypes = Array.isArray(this.layout.type) ? this.layout.type : [ this.layout.type ];

        let currentType: string = typeof value;
        if(currentType === 'object') {
            if(value instanceof Date) {
                currentType = 'date';
            }
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
                return (typeof value.toString === 'function' ? value.toString() : value+'');
            case 'boolean':
                if(value == 'true') return true;
                if(value == 'false') return false;
                return !!value;
            case 'date':
                return (value instanceof Date ? value : new Date(value));
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