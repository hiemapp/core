import { ControllerType } from './Controller';
import Model from './Model';

export default class ControllerRegister {
    protected static register: Record<string, ControllerType> = {};

    static add(controller: ControllerType) {
        this.register[controller.name] = controller;
    }

    static get(model: typeof Model) {
        const controllerName = `${model.name}Controller`;
        return this.register[controllerName];
    }
}