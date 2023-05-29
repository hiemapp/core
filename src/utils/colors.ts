const colors = {
    BLUE: '$blue',
    CYAN: '$cyan',
    GREEN: '$green',
    ORANGE: '$orange',
    PINK: '$pink',
    PURPLE: '$purple',
    RED: '$red',
    YELLOW: '$yellow',
} as const;

export type Color = typeof colors[keyof typeof colors];

export default colors;