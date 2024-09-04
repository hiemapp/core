export function isValidDate(date: Date) {
    return date instanceof Date && !isNaN(date as any);
}