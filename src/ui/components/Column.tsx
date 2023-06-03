import { Component } from '~types';
import * as jsx from '../jsx';

type ColumnSpan = 1|2|3|4|5|6|7|8|9|10|11|12|'auto';
type ColumnBreakpoint = 'default'|'xs'|'sm'|'md'|'lg'|'xl';
export interface ColumnProps extends JSX.Props {
    span?: ColumnSpan | Partial<Record<ColumnBreakpoint, ColumnSpan>>
    className?: string
}

function getColClasses(span?: Required<ColumnProps>['span']) {
    if(!span) {
        return [];
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

    return classList;
}

const Column: Component<ColumnProps> = ({ span, className, ...props }) => (
    <div {...props} className={[getColClasses(span), className]} />
);

export default Column;