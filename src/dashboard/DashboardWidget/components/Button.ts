import { componentFactory } from '../utils/helpers';
import WidgetNode from '../nodes/WidgetNode';

export interface ButtonProps {
    onClick?: () => unknown
}

const Button = componentFactory<ButtonProps>(
    ({ onClick, children }) => {
        console.log({ onClick });
        return new WidgetNode(
            'button', 
            undefined,
            children,
            { onClick }
        );
    }
)

export default Button;