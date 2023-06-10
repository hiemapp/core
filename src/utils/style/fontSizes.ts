export const fontSizes = {
    XS: 'var(--font-size-xs)', 
    SM: 'var(--font-size-sm)',
    MD: 'var(--font-size-md)',
    LG: 'var(--font-size-lg)',
    XL: 'var(--font-size-xl)'
} as const;

export type FontSize = typeof fontSizes[keyof typeof fontSizes];