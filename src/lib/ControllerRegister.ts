import { Constructor } from '~types/helpers';
import { ControllerType } from './Controller';
import Model from './Model';
import { Device } from '~/devices';

export default class ControllerRegister {
    protected static register: Record<string, ControllerType<any>> = {};

    static add(controller: ControllerType) {
        this.register[controller.name] = controller;
    }

    static get<T extends Model<any>>(model: Constructor<T>): ControllerType<T> {
        const controllerName = `${model.name}Controller`;
        return this.register[controllerName];
    }
}