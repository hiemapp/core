import * as _ from 'lodash';
import Model from '../lib/Model';
import ModelWithProps from './ModelWithProps';

export type FilterPredicate<TModel> = (model: TModel) => boolean | string | number | void | null;
export type ControllerType = ReturnType<typeof Controller>;

export default function Controller<TModel extends Model<any>>() {
    type TId = ReturnType<TModel['getId']>;
    
    abstract class Controller {
        static data: Record<TId, TModel>;

        static index(): TModel[] {
            return Object.values(this.indexObject());
        }

        static indexBy(predicate: FilterPredicate<TModel>): TModel[] {
            return _.filter(this.index(), model => !!predicate(model));
        }

        static find(id: TId): TModel {
            return this.indexObject()[id];
        }

        static findBy(propKey: string, propValue: any): TModel;
        static findBy(predicate: FilterPredicate<TModel>): TModel;
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

        static update(id: TId, value: TModel) {}

        static exists(id: TId): boolean {
            return this.find(id) != undefined;
        }

        static store(data: Record<TId, TModel>): void {
            this.data = data;
        }

        static load(...args: any[]): void;
        static load(): void {
            throw new Error('Method load() is not implemented.');
        }

        static indexObject(): Record<TId, TModel> {
            if (!this.data) throw new Error(`${this.name} must be loaded() before calling index().`);

            return this.data;
        }
    }

    return Controller;
}
