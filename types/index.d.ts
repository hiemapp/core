export * from './devices';
export * from './flows';
export * from './utils';

import type ModelWithProps from '~/lib/ModelWithProps';
export type Constructor<T> = new (...args: any[]) => T;
export type GetPropsSerializedType<M extends ModelWithProps<any, any>> = M extends ModelWithProps<any, infer S> ? S : never;
