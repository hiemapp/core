import ExtensionModule, { ExtensionModuleConfig, TExtensionModule, ExtensionModuleProvider, ExtensionModuleProviderFunction } from '../extensions/ExtensionModule';
import type { IFlowBlockManifest, IFlowBlockFormat } from './FlowBlock.types';
import type { IFlowBlockLayout, IFlowBlockLayout_parameter } from './FlowBlockLayout.types';
import type { FlowBlockTask } from './FlowBlockTask.types';
import type FlowBlockContext from './FlowBlockContext/FlowBlockContext';
import ModelWithProps from '~/lib/ModelWithProps';
import FlowBlockLayout from './FlowBlockLayout';

export interface TFlowBlock extends TExtensionModule {
    providers: TExtensionModule['providers'] & {
        format: () => IFlowBlockFormat,
        syntax: () => string[],
        manifest: () => IFlowBlockManifest,
        run: (block: FlowBlockContext) => unknown
    },
    methods: {
        getFormat: () => IFlowBlockFormat,
        getLayout: () => FlowBlockLayout,
        getSyntax: () => string[]
    },
    events: {
        'load': [ FlowBlockContext ],
        'unload': [ FlowBlockContext ],
        'mount': [ FlowBlockContext ],
        'task': [ FlowBlockContext, FlowBlockTask ]
    }
}

export default class FlowBlock<TData extends {} = {}> extends ExtensionModule<TFlowBlock, TData> {
    protected _init() {
        this.$module.methods.getFormat = this._getFormat.bind(this);
        this.$module.methods.getLayout = this._getLayout.bind(this) as any;
        this.$module.methods.getSyntax = this._getSyntax.bind(this);
    }

    set run(run: ExtensionModuleProviderFunction<TFlowBlock, 'run'>) {
        this._registerProvider('run', run);
    }

    setSyntax(syntax: ExtensionModuleProvider<TFlowBlock, 'syntax'>) {
        return this._registerProvider('syntax', syntax);
    }

    setManifest(manifest: ExtensionModuleProvider<TFlowBlock, 'manifest'>) {
        return this._registerProvider('manifest', manifest);
    }

    setFormat(format: ExtensionModuleProvider<TFlowBlock, 'format'>) {
        return this._registerProvider('format', format);
    }

    setLayout(layout: ExtensionModuleProvider<TFlowBlock, 'layout'>) {
        // this._registerProvider('layout', layout);
    }

    static serializeParameterLayout(param: IFlowBlockLayout_parameter) {
        if(Array.isArray(param?.options)) {
            param.options = param.options.map(opt => {
                if(opt instanceof ModelWithProps) {
                    return { label: opt.getProp('name'), value: opt.id }
                }

                return opt;
            })
        }

        return param;
    }

    protected _getSyntax() {
        if(!this._hasProvider('syntax'))  return [];
        return this.$module.methods.callProvider('syntax', []);    
    }

    protected _getLayout() {
        return null;
    }

    protected _getFormat() {
        if(!this._hasProvider('format')) {
            return { inputs: [] };
        }

        return this.$module.methods.callProvider('format', []);
    }
}
