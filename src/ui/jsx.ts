import HTMLElement from './HTMLElement';
import type { HTMLElementProps, ValidElement, AnyElement } from '~types';
import { formatElement } from './utils/helpers';
import { forOwn } from 'lodash';

export function h<TProps extends HTMLElementProps>(type: ((...args: any[]) => AnyElement) | string, config: TProps | null, ...childElements: AnyElement[]): ValidElement {
    // Children can also be passed as a prop. The prop is only used if
    // no child elements are passed directly.
    let children: AnyElement[] | null = null;

    if(childElements.length) {
        children = childElements;
    } else if(config?.children?.length) {
        children = config.children;
    }

    const props: HTMLElementProps = {};
    forOwn(config, (value, key) => {
        if(key.toLowerCase().startsWith('on')) {
            // Event listener
            return true;
        }
        
        (props as any)[key] = value;
    })
    
    if(typeof type === 'string') {
        // @ts-ignore
        if(type === 'clientelement' && typeof props?.tag === 'string') {
            // @ts-ignore
            return h(props.tag, props.props, ...(children ?? []));
        }

        return new HTMLElement(type, props, children);
    }

    if(typeof type === 'function') {
        const element = type({ ...props, children });
        return formatElement(element);
    }

    return null;
}