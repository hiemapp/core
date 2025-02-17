import * as _ from 'lodash';
import Model, { InferModelType } from '../lib/Model';
import ModelWithProps from './ModelWithProps';
import ControllerRegister from './ControllerRegister';

export type FilterPredicate<TModel> = (model: TModel) => boolean | string | number | void | null;
export type ControllerType = ReturnType<typeof Controller>;

export default function Controller<T extends Model<any>>() {
    type TId = InferModelType<T>['id'];
    
    abstract class Controller {
        static data: Record<TId, T>;

        static index(): T[] {
            return Object.values(this.indexObject());
        }

        static indexBy(predicate: FilterPredicate<T>): T[] {
            return _.filter(this.index(), model => !!predicate(model));
        }

        static find(id: TId): T {
            const model = this.indexObject()[id];
            if(!(model instanceof Model)) {
                throw new Error(`Cannot find model '${id}'.`);
            }
            return model;
        }

        static findBy(propKey: string, propValue: any): T;
        static findBy(predicate: FilterPredicate<T>): T;
        static findBy(...args: any[]) {
            if (typeof args[0] === 'function') {
                return _.find(this.index(), args[0]);
            }

            if (typeof args[0] === 'string') {
                return _.find(this.index(), (o) => {
                    if(o instanceof ModelWithProps) {
                        return (o.getProp(args[0]) === args[1]);
                    }

                    return false;
                });
            }

            return null;
        }

        static update(resource: T) {}

        static exists(id: TId): boolean {
            return this.find(id) != undefined;
        }

        static store(data: Record<TId, T>): void {
            this.data = data;
        }

        static load(...args: any[]): void;
        static load(): void {
            ControllerRegister.add(this);
        }

        static indexObject(): Record<TId, T> {
            if (!this.data) throw new Error(`${this.name} must be loaded() before calling index().`);

            return this.data;
        }
    }

    return Controller;
}
