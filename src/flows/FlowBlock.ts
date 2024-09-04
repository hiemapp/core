import ExtensionModule, { ExtensionModuleConfig, TExtensionModule, ExtensionModuleProvider, ExtensionModuleProviderFunction } from '../extensions/ExtensionModule';
import type { IFlowBlockManifest } from './FlowBlock.types';
import type { IFlowBlockLayout, IFlowBlockLayout_parameter } from './FlowBlockLayout.types';
import type { FlowBlockTask } from './FlowBlockTask.types';
import type FlowBlockContext from './FlowBlockContext/FlowBlockContext';
import ModelWithProps from '~/lib/ModelWithProps';
import FlowBlockLayout from './FlowBlockLayout';

export interface TFlowBlock extends TExtensionModule {
    providers: TExtensionModule['providers'] & {
        manifest: () => IFlowBlockManifest
        layout: () => IFlowBlockLayout
        run: (block: FlowBlockContext) => unknown
    },
    methods: {
        getLayout: () => FlowBlockLayout
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
        this.$module.methods.getLayout = this._getLayout.bind(this);
    }

    set run(run: ExtensionModuleProviderFunction<TFlowBlock, 'run'>) {
        this._registerProvider('run', run);
    }

    setManifest(manifest: ExtensionModuleProvider<TFlowBlock, 'manifest'>) {
        return this._registerProvider('manifest', manifest);
    }

    setLayout(layout: ExtensionModuleProvider<TFlowBlock, 'layout'>) {
        this._registerProvider('layout', layout);
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

    protected _getLayout() {
        const json = this.$module.methods.callProvider('layout', []);
        return new FlowBlockLayout(json);
    }
}
