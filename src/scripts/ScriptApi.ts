import Script from './Script';
import { Exports } from './api/home';
import { ApiControllerModule } from './api/lib/ApiControllerModule';
import { Device_SA } from './api/devices/Device.script-api';
import Device from '~/devices/Device';
import { ModelWithProps } from '~/lib';
import { ModelWithProps_SA } from './api/lib/ModelWithProps.script-api';
import { RepeatingTask_SA } from './api/utils/RepeatingTask.script-api';
import { Constructor } from '~types/helpers';
import { ApiModule_SA } from './api/lib/ApiStaticModule.script-api';
import { DevicesModule_SA } from '~/scripts/api/devices/DevicesModule.script-api';

export default class ScriptApi {
    script: Script;

    constructor(script: Script) {
        this.script = script;
    }

    getObject(): Exports {
        return {
            devices: this.loadControllerModule(DevicesModule_SA, Device_SA, Device),
            RepeatingTask: this.loadStaticModule(RepeatingTask_SA)
        }
    }

    loadControllerModule(controllerModule: Constructor<ApiControllerModule<any>>, model: Constructor<ModelWithProps_SA<any>>, innerModel: Constructor<ModelWithProps<any>>): any {
        const module = new controllerModule(model, innerModel);
        module._init(this.script);
        return module;
    }

    loadStaticModule(factory: () => any): any {
        const module: typeof ApiModule_SA = factory();
        module._init(this.script);
        return module;
    }
}