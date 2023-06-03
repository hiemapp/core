import HTMLElement from './HTMLElement';
import type { HTMLElementProps, HTMLElementListener, ValidElement, AnyElement } from '~types';
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
    const listeners: Record<string, HTMLElementListener> = {};
    forOwn(config, (value, key) => {
        if(typeof key !== 'string') {
            return true;
        }

        if(key.trim().toLowerCase().startsWith('on')) {
            listeners[key] = value as HTMLElementListener;
            return true;
        }
        
        (props as any)[key] = value;
    })
    
    // Return a plain HTML element
    if(typeof type === 'string') {
        // @ts-ignore
        if(type === 'clientelement' && typeof props?.tag === 'string') {
            // @ts-ignore
            return h(props.tag, props.props, ...(children ?? []));
        }

        return new HTMLElement(type, props, children, listeners);
    }

    // Call the component render function
    if(typeof type === 'function') {
        const element = type({ ...props, ...listeners, children });
        return formatElement(element);
    }

    return null;
}