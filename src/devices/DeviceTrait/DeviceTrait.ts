import _ from 'lodash';
import { IDeviceTrait, DeviceTraitCommandRegistry, DeviceTrait_config, DeviceTraitDisplayProvider } from './DeviceTrait.types';
import Device from '../Device';
import DeviceDisplay from '../DeviceDisplay';

export default abstract class DeviceTrait<TTrait extends IDeviceTrait> {
    commandRegistry: DeviceTraitCommandRegistry<TTrait> = {} as any;
    private displayProvider: DeviceTraitDisplayProvider;
    private options: TTrait['options'];
    private defaultOptions: Required<TTrait['options']> = {} as any;
    private config: DeviceTrait_config;

    constructor(options?: TTrait['options']) {
        this.options = options ?? {};
        this.init();
    }

    protected setConfig(config: DeviceTrait_config) {
        this.config = config;
    }

    protected setDefaultOptions(defaultOptions: Required<TTrait['options']>) {
        this.defaultOptions = defaultOptions;
    }

    protected setDisplayProvider(stateProvider: DeviceTraitDisplayProvider) {
        this.displayProvider = stateProvider;
    }

    protected setCommandRegistry(commandRegistry: DeviceTraitCommandRegistry<TTrait>) {
        this.commandRegistry = commandRegistry;
    }

    getDisplay(device: Device, display: DeviceDisplay) {
        if(typeof this.displayProvider !== 'function') return null;
        return this.displayProvider(device, display);
    }
    
    getOption<TKey extends keyof TTrait['options']>(keypath: TKey): Exclude<TTrait['options'][TKey], undefined>; 
    getOption(keypath: string): any;
    getOption(keypath: string): any {
        const value = _.get(this.options, keypath);

        if(typeof value === 'undefined') {
            throw new Error(`Option '${keypath}' is undefined.`);
        }

        return value;
    }

    getState(device: Device): TTrait['state'] {
        return device.getMetadata(`traits.${this.getName()}.state`) ?? {};
    }

    setState(device: Device, partialState: Partial<TTrait['state']>, emitUpdateEvent: boolean = false) {
        device.setMetadata(`traits.${this.getName()}.state`, partialState);

        if(emitUpdateEvent) {
            device.emit('state:update', { reason: 'trait' });
        }
    }

    getName() {
        return this.constructor.name.slice(0, -5).toLowerCase();
    }

    toJSON() {
        return {
            name: this.constructor.name,
            config: this.config,
            options: _.defaultsDeep(this.options, this.defaultOptions)
        }
    }

    protected abstract init(): void;
}