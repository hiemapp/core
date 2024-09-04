import ExtensionModule, { ExtensionModuleProviderFunction, TExtensionModule } from '~/extensions/ExtensionModule';

export interface DashboardWidgetRenderOptions {
    colorScheme?: 'light'|'dark';
}

export interface TDashboardWidget extends TExtensionModule {
    methods: {
        render: (options: DashboardWidgetRenderOptions) => string
    }
}

export default class DashboardWidget<TData extends {} = {}> extends ExtensionModule<TDashboardWidget, TData> {
    constructor(name: string) {
        super(name);

        this.$module.methods.render = this._render.bind(this);
    }

    set render(render: ExtensionModuleProviderFunction<TDashboardWidget, 'render'>) {
        this._registerProvider('render', render);
    }

    protected _render() {
        let content = 'No renderer function provided.';

        if(this._hasProvider('render')) {
            content = this._callProvider('render', []);
        }

        return content;
    }
}