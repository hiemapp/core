import Model from '../lib/Model';
import Manifest from '~/utils/Manifest';
import type { FlowBlock, FlowBlockCategory } from '~/flows';
import { DeviceConnector, DeviceDriver } from '~/devices';
import type { LanguageProvider } from '~/localization';
import type { DashboardWidget } from '~/dashboard';
import type { Constructor } from '~types/helpers';
import { logger } from '~/lib/Logger';

export type ExtensionModuleName = string;

export type ExtensionModule<TManifest extends {} = {}> = ReturnType<typeof ExtensionModuleFactory<TManifest>>;

export type ExtensionModuleClass = (new (...args: any[]) => any) & {
    [k in keyof ExtensionModule]: ExtensionModule[k]
};

export interface ExtensionModuleConfig {
    manifestRequired?: boolean
}

function ExtensionModuleFactory<TManifest extends {} = {}>() {
    return class ExtensionModule {
        static _manifest: Manifest<TManifest>;
        static get manifest(): Manifest<TManifest> { return this._manifest; }
        get manifest(): Manifest<TManifest> { return (this as any).constructor._manifest; }

        logger = logger.child({ label: this.constructor.name });
        _eventListeners: Record<string, Array<(data: unknown) => unknown>> = {};

        static isExtensionModule: true = true;
        static extensionModuleConfig: ExtensionModuleConfig = {
            manifestRequired: false
        };

        emit(event: string, data?: unknown) {
            if (!this._eventListeners[event]?.length) return;

            this._eventListeners[event].forEach(listener => {
                listener(data);
            });
        }

        on(event: string, listener: (data: unknown) => unknown) {
            this._eventListeners[event] ??= [];
            this._eventListeners[event].push(listener);
        }

        public static init(): void { };

        static validate(): void {
            if (this.extensionModuleConfig.manifestRequired === true && !(this.manifest instanceof Manifest)) {
                throw new Error('No manifest was defined.');
            }
        }

        static defineManifest(manifest: TManifest) {
            if (this.manifest instanceof Manifest) {
                throw new Error('Cannot redefine manifest.');
            }

            this._manifest = new Manifest(manifest);
        }
    }
}

export { ExtensionModuleFactory };
