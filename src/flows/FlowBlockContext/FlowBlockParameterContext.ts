import { FlowBlockManifestParameter , FlowScriptBlockParameter } from 'types';
import FlowBlockInputContext from './FlowBlockInputContext';
import { ensureFind } from '~/utils/object';

export default class FlowBlockParameterContext extends FlowBlockInputContext {
    protected manifest: FlowBlockManifestParameter;
    protected def: FlowScriptBlockParameter;

    init() {
        this.def = ensureFind(this.blockDef.parameters!, p => p.id === this.id);
        this.manifest = ensureFind(this.blockManifest.parameters!, p => p.id === this.id);
    }

    async value() {
        return new Promise<any>(async (resolve, reject) => {
            if(typeof this.def.value.constant !== 'undefined') {
                const value = this._formatValue(this.def.value.constant);
                return resolve(value);
            }

            if(typeof this.def.value.block === 'string') {
                const block = this.block.root().findBlock(this.def.value.block);

                const value = await block.execute();
                return resolve(value);
            } 
        })
    }

    protected _formatValue(value: any) {
       // Create list of allowed types
        const allowedTypes = Array.isArray(this.manifest.type) ? this.manifest.type : [ this.manifest.type ];

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
        const manifest = this.blockManifest.parameters?.find?.(p => p.id === this.id);
        if(!manifest) {
            throw new Error(`Manifest for parameter '${this.id}' not found.`);
        }
        return manifest;
    }

    protected findDef() {
        const def = this.blockDef.parameters.find(p => p.id === this.id);
        if(!def) {
            throw new Error(`Definition for parameter '${this.id}' not found.`);
        }
        return def;
    }
}