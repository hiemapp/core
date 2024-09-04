import { Connector } from '~/connectors';
import ExtensionModule, { ExtensionModuleProviderFunction, TExtensionModule } from '../extensions/ExtensionModule';
import Device from './Device';
import DeviceTrait from './DeviceTrait/DeviceTrait';
import DeviceCommandParams from './DeviceTrait/DeviceCommandParams';
import { InferDeviceTraitConfig } from './DeviceTrait/DeviceTrait.types';
import { Constructor } from '~types/helpers';
import { DeviceDriverManifest } from './DeviceDriver.types';

export interface TDeviceDriver extends TExtensionModule {
    providers: TExtensionModule['providers'] & {
        manifest: (device: Device) => DeviceDriverManifest;
        checkConnection: (device: Device) => boolean;
    },
    events: {
        'connectors:add': [ Connector ],
        'devices:add': [ Device ]
    },
    methods: {
        addDevice: (device: Device) => boolean
    }
}

export default class DeviceDriver<TData extends {} = {}> extends ExtensionModule<TDeviceDriver, TData> {
    protected _devices: Device[] = [];

    protected _init() {
        this.$module.methods.addDevice = this._addDevice.bind(this);
    }

    set checkConnection(checkConnection: ExtensionModuleProviderFunction<TDeviceDriver, 'checkConnection'>) {
        this._registerProvider('checkConnection', checkConnection);
    }

    addCommand<TTrait extends DeviceTrait<any>, TCommand extends keyof InferDeviceTraitConfig<TTrait>['commands'] & string>(
        command: TCommand, 
        handler: (device: Device, params: DeviceCommandParams<InferDeviceTraitConfig<TTrait>['commands'][TCommand]>) => unknown, 
        trait?: Constructor<TTrait>
    ) {
        this._registerProvider(`commands.${command}`, handler);
    }

    getDevices() {
        return [...this._devices];
    }

    protected _addDevice(device: Device) {
        if(this._devices.includes(device)) return false;

        const isNewConnector = this._devices.every(d => d.connector !== device.connector);
        if(isNewConnector) {
            this.emit('connectors:add', device.connector);
        }

        this._devices.push(device);
        this.emit('devices:add', device);

        return true;
    }
}