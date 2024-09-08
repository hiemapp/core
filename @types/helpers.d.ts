import type ModelWithProps from '~/lib/ModelWithProps';
export type Constructor<T> = new (...args: any[]) => T;
export type GetPropsSerializedType<M extends ModelWithProps<any>> = M extends ModelWithProps<infer T> ? T['serializedProps'] : never;
export type Values<T extends Array> = T[number];