import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';

type ColumnSpan = 1|2|3|4|5|6|7|8|9|10|11|12|'auto';
type ColumnBreakpoint = 'default'|'xs'|'sm'|'md'|'lg'|'xl';
export interface ColumnProps {
    span?: ColumnSpan | Partial<Record<ColumnBreakpoint, ColumnSpan>>
}

function getColClasses(span: Required<ColumnProps>['span']) {
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

const Column = componentFactory<ColumnProps>(
    ({ span, className, children, ...props }) => {
        return new WidgetNode(
            'div', 
            {
                ...props,
                className: [className, span && getColClasses(span)]
            },
            children
        );
    }
)

export default Column;