import type ModelWithProps from '~/lib/ModelWithProps';
import type { ExtensionModule } from '~/extensions/ExtensionModule';
export type Constructor<T> = new (...args: any[]) => T;
export type GetPropsSerializedType<M extends ModelWithProps<any, any>> = M extends ModelWithProps<any, infer S> ? S : never;