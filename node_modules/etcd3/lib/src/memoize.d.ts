/**
 * Decorates a property or accessor with a memoization. By default it memoizes
 * based on a strict equality check of the function's first parameter. Inspired
 * by: https://gist.github.com/dsherret/cbe661faf7e3cfad8397
 */
export declare function Memoize(hasher?: (...args: any[]) => any): (_target: any, _prop: string, descriptor: TypedPropertyDescriptor<any>) => void;
/**
 * Clears memoized values for a function on the provided object instance.
 */
export declare function forget(instance: any, func: Function): void;
