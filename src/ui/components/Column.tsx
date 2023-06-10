import { Component, HTMLElementProps } from '~/ui/types';
import * as jsx from '../types';

type ColumnSpan = 1|2|3|4|5|6|7|8|9|10|11|12|'auto';
type ColumnBreakpoint = 'default'|'xs'|'sm'|'md'|'lg'|'xl';
export interface ColumnProps extends HTMLElementProps {
    span?: ColumnSpan | Partial<Record<ColumnBreakpoint, ColumnSpan>>
}

function getColClassName(span?: Required<ColumnProps>['span']) {
    if(!span) {
        return '';
    }

    if(typeof span === 'number') {
        span = { default: span };
    }

    let classList: string[] = [];
    Object.entries(span).forEach(([ breakpoint, breakpointSpan ]) => {
        let className = `col-${breakpoint}-${breakpointSpan}`;

        if(breakpoint === 'default') {
            className = `col-${breakpointSpan}`;
        }

        classList.push(className);
    })

    return classList.join(' ');
}

const Column: Component<ColumnProps> = ({ span, ...props }) => (
    <div {...props} className={getColClassName(span)} />
);

export default Column;