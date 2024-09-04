export class Palette {
    [key: number]: string;
    length: number;
    id: string;

    constructor(id: string, length: number) {
        this.id = id;
        this.length = length;

        for (let i = 0; i < length; i++) {
            this[i] = `$${this.id}-${i}`
        }
    }

    toString() {
        return this.id;
    }

    toJSON() { return this.toString(); }
}

export const palettes = {
    BLUE: new Palette('blue', 10),
    CYAN: new Palette('cyan', 10),
    GREEN: new Palette('green', 10),
    ORANGE: new Palette('orange', 10),
    PINK: new Palette('pink', 10),
    PURPLE: new Palette('purple', 10),
    RED: new Palette('red', 10),
    YELLOW: new Palette('yellow', 10),
    GRAY: new Palette('gray', 14)
} as const;
