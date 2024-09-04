import _ from 'lodash';
import { ValueAssertionError } from '~/errors';

export type AsserterCallback<TArgs extends any[]> = (...args: TArgs) => unknown;

export default class ValueAsserter {
    static assert(v: any) {
        const isDefined = this.createMethod(v, () =>
            typeof v !== 'undefined' && v !== null,
            'Value is not defined.');

        const isNumber = this.createMethod(v, () =>
            isDefined() && typeof v === 'number' && !Number.isNaN(v),
            'Value is not a number.');

        const isString =  this.createMethod(v, () =>
            isDefined() && typeof v === 'string',
            'Value is not a string.');

        const isMin = this.createMethod(v, (min: number) => 
            isNumber() && v >= min,
            'Value must be greater than %1.');

        const isMax = this.createMethod(v, (max: number) => 
            isNumber() && v <= max,
            'Value must be less than %1.'); 
            
        const isBetween = this.createMethod(v, (min: number, max: number) => 
            isMin(min) && isMax(max),
            'Value must be between %1 and %2.');

        return { isDefined, isNumber, isString, isMin, isMax, isBetween };
    }
    
    protected static createMethod<TArgs extends any[]>(value: any, callback: AsserterCallback<TArgs>, message: string) {
        return (...args: TArgs): any => {
            let result = false;
            try {
                result = !!callback(...args);
            } catch(err) {}

            if(result !== true) {
                for (let i = args.length; i > 0; i--) {
                    message = message.replace(`%i`, args[i]);
                    
                }
                throw new ValueAssertionError(message);
            }

            return this.assert(value);
        }
    }
}