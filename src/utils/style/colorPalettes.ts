const colorPalettes = {
    BLUE: '$blue',
    CYAN: '$cyan',
    GREEN: '$green',
    ORANGE: '$orange',
    PINK: '$pink',
    PURPLE: '$purple',
    RED: '$red',
    YELLOW: '$yellow',
    GRAY: '$gray'
} as const;

export type ColorPalette = typeof colorPalettes[keyof typeof colorPalettes];

export default colorPalettes;