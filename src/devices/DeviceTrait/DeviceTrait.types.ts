import Device from '~/devices/Device';
import DeviceTrait from './DeviceTrait';
import DeviceDisplay from '../DeviceDisplay';
import DeviceCommandParams from './DeviceCommandParams';

export type DeviceTraitCommandRegistry<IConfig extends IDeviceTrait> = {
    [TKey in keyof IConfig['commands']]: DeviceTraitCommandHandler<IConfig['commands'][TKey]> | null
}

export type DeviceTraitDisplayProvider = (device: Device, display: DeviceDisplay) => DeviceDisplay|void;

export interface DeviceTrait_config {
    menu: boolean;
}

export interface IDeviceTrait {
    options: Record<string, any>;
    commands: Record<string, Record<string, any>>;
    state: Record<string, any>;
}

export interface DeviceTraitDefaultOptions<ITrait extends any> {
    primaryAction?: false | {
        command: ITrait extends IDeviceTrait ? keyof ITrait['commands'] : string;
        params?: any
    };
    passive?: boolean;
}

export type InferDeviceTraitConfig<T extends DeviceTrait<any>> = T extends DeviceTrait<infer C> ? C : never;
export type DeviceTraitCommandHandler<TParams extends Record<string, any>> = (device: Device, params: DeviceCommandParams<TParams>) => unknown