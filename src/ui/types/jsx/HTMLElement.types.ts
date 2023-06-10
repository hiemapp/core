export interface HTMLElement {
    attributes: {
        id?: string;
        style?: {
            color?: string;
            backgroundColor?: string;

            padding?: string;
            paddingTop?: string | number;
            paddingRight?: string | number;
            paddingBottom?: string | number;
            paddingLeft?: string | number;

            margin?: string;
            marginTop?: string | number;
            marginRight?: string | number;
            marginBottom?: string | number;
            marginLeft?: string | number;

            fontWeight?: string | number;
            fontSize?: string | number;

            display?: 'block' | 'flex' | 'inline-block' | 'inline-flex' | 'none';
            position?: 'relative' | 'absolute' | 'static' | 'sticky' | 'fixed';

            opacity?: number;

            [key: string]: string | number | undefined;
        }
    }
}