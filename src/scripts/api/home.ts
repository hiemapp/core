import { IApiControllerModule } from '~/scripts/api/lib/ApiControllerModule';
import type { IApiStaticModule } from './lib/ApiStaticModule.script-api';
import { RepeatingTask_SA } from './utils/RepeatingTask.script-api';
import { DevicesModule_SA } from '~/scripts/api/devices/DevicesModule.script-api';
import { time_SA } from './utils/time.script-api';

export interface Exports {
    devices: IApiControllerModule<DevicesModule_SA>,
    RepeatingTask: IApiStaticModule<typeof RepeatingTask_SA>

    /**
     * Parses a time string. Returns the current time if no time string is given.
     * @example
     * home.time('7:00')
     * @example
     * home.time('9.30pm')
     * @param time The time string to parse.
     * @returns The time in milliseconds.
     */
    time: typeof time_SA
}