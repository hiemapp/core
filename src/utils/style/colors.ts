const colorSets = {
    BLUE: ['var(--blue-0)', 'var(--blue-1)', 'var(--blue-2)', 'var(--blue-3)', 'var(--blue-4)', 'var(--blue-5)', 'var(--blue-6)', 'var(--blue-7)', 'var(--blue-8)', 'var(--blue-9)'],
    CYAN: ['var(--cyan-0)', 'var(--cyan-1)', 'var(--cyan-2)', 'var(--cyan-3)', 'var(--cyan-4)', 'var(--cyan-5)', 'var(--cyan-6)', 'var(--cyan-7)', 'var(--cyan-8)', 'var(--cyan-9)'],
    GREEN: ['var(--green-0)', 'var(--green-1)', 'var(--green-2)', 'var(--green-3)', 'var(--green-4)', 'var(--green-5)', 'var(--green-6)', 'var(--green-7)', 'var(--green-8)', 'var(--green-9)'],
    ORANGE: ['var(--orange-0)', 'var(--orange-1)', 'var(--orange-2)', 'var(--orange-3)', 'var(--orange-4)', 'var(--orange-5)', 'var(--orange-6)', 'var(--orange-7)', 'var(--orange-8)', 'var(--orange-9)'],
    PINK: ['var(--pink-0)', 'var(--pink-1)', 'var(--pink-2)', 'var(--pink-3)', 'var(--pink-4)', 'var(--pink-5)', 'var(--pink-6)', 'var(--pink-7)', 'var(--pink-8)', 'var(--pink-9)'],
    PURPLE: ['var(--purple-0)', 'var(--purple-1)', 'var(--purple-2)', 'var(--purple-3)', 'var(--purple-4)', 'var(--purple-5)', 'var(--purple-6)', 'var(--purple-7)', 'var(--purple-8)', 'var(--purple-9)'],
    RED: ['var(--red-0)', 'var(--red-1)', 'var(--red-2)', 'var(--red-3)', 'var(--red-4)', 'var(--red-5)', 'var(--red-6)', 'var(--red-7)', 'var(--red-8)', 'var(--red-9)'],
    YELLOW: ['var(--yellow-0)', 'var(--yellow-1)', 'var(--yellow-2)', 'var(--yellow-3)', 'var(--yellow-4)', 'var(--yellow-5)', 'var(--yellow-6)', 'var(--yellow-7)', 'var(--yellow-8)', 'var(--yellow-9)'],
    GRAY: ['var(--gray-0)', 'var(--gray-1)', 'var(--gray-2)', 'var(--gray-3)', 'var(--gray-4)', 'var(--gray-5)', 'var(--gray-6)', 'var(--gray-7)', 'var(--gray-8)', 'var(--gray-9)', 'var(--gray-10)', 'var(--gray-11)', 'var(--gray-12)', 'var(--gray-13)']
} as const;

const colorValues = {
    TEXT_LIGHT: 'var(--text-light)',
    TEXT_DARK: 'var(--text-dark)',
    TEXT_MUTED: 'var(--text-muted)',
    TEXT_PRIMARY: 'var(--text-primary)',
    TEXT_PRIMARY_INVERSE: 'var(--text-primary)-inverse'
} as const;

const colors = { ...colorSets, ...colorValues };

export type Color = typeof colorSets[keyof typeof colorSets][number] | typeof colorValues[keyof typeof colorValues];

export default colors;