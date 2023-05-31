const colorLists = {
    BLUE: ['$blue-0', '$blue-1', '$blue-2', '$blue-3', '$blue-4', '$blue-5', '$blue-6', '$blue-7', '$blue-8', '$blue-9'],
    CYAN: ['$cyan-0', '$cyan-1', '$cyan-2', '$cyan-3', '$cyan-4', '$cyan-5', '$cyan-6', '$cyan-7', '$cyan-8', '$cyan-9'],
    GREEN: ['$green-0', '$green-1', '$green-2', '$green-3', '$green-4', '$green-5', '$green-6', '$green-7', '$green-8', '$green-9'],
    ORANGE: ['$orange-0', '$orange-1', '$orange-2', '$orange-3', '$orange-4', '$orange-5', '$orange-6', '$orange-7', '$orange-8', '$orange-9'],
    PINK: ['$pink-0', '$pink-1', '$pink-2', '$pink-3', '$pink-4', '$pink-5', '$pink-6', '$pink-7', '$pink-8', '$pink-9'],
    PURPLE: ['$purple-0', '$purple-1', '$purple-2', '$purple-3', '$purple-4', '$purple-5', '$purple-6', '$purple-7', '$purple-8', '$purple-9'],
    RED: ['$red-0', '$red-1', '$red-2', '$red-3', '$red-4', '$red-5', '$red-6', '$red-7', '$red-8', '$red-9'],
    YELLOW: ['$yellow-0', '$yellow-1', '$yellow-2', '$yellow-3', '$yellow-4', '$yellow-5', '$yellow-6', '$yellow-7', '$yellow-8', '$yellow-9'],
    GRAY: ['$gray-0', '$gray-1', '$gray-2', '$gray-3', '$gray-4', '$gray-5', '$gray-6', '$gray-7', '$gray-8', '$gray-9', '$gray-10', '$gray-11', '$gray-12', '$gray-13']
} as const;

const colorValues = {
    TEXT_LIGHT: '$text-light',
    TEXT_DARK: '$text-dark',
    TEXT_MUTED: '$text-muted',
    TEXT_PRIMARY: '$text-primary',
    TEXT_PRIMARY_INVERSE: '$text-primary-inverse'
} as const;

export type Color = typeof colorLists[keyof typeof colorLists][number] | typeof colorValues[keyof typeof colorValues];

const colors = { ...colorLists, ...colorValues };
export default colors;