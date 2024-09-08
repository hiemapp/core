import { IApiControllerModule } from '~/scripts/api/lib/ApiControllerModule';
import type { IApiStaticModule } from './lib/ApiStaticModule.script-api';
import { RepeatingTask_SA } from './utils/RepeatingTask.script-api';
import { DevicesModule_SA } from '~/scripts/api/devices/DevicesModule.script-api';

export interface Exports {
    devices: IApiControllerModule<DevicesModule_SA>,
    RepeatingTask: IApiStaticModule<typeof RepeatingTask_SA>
}