import type { palettes } from './palettes';

export const colors = {
    TEXT_LIGHT: 'var(--text-light)',
    TEXT_DARK: 'var(--text-dark)',
    TEXT_MUTED: 'var(--text-muted)',
    TEXT_MUTED_ALT: 'var(--text-muted-alt)',
    TEXT_PRIMARY: 'var(--text-primary)',
    TEXT_PRIMARY_INVERSE: 'var(--text-primary-inverse)'
} as const;

export type Color = typeof colors[keyof typeof colors] | typeof palettes[keyof typeof palettes][number];
