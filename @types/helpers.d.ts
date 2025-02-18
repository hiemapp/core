import type ModelWithProps from '~/lib/ModelWithProps';
export type Constructor<T> = new (...args: any[]) => T;
export type Values<T extends Array> = T[number];