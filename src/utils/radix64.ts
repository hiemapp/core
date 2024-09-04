// Adapted from: https://github.com/amosyuen/radix64

var BASE = 64;
var BASE_BITS = 6;

// Use URL safe characters in lexicographically sorted order
var ALPHABET = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

var ALPHABET_FLIPPED: Record<string, number> = {};
for (var i = 0; i < ALPHABET.length; i++) {
    ALPHABET_FLIPPED[ALPHABET[i]] = i;
}

export function encodeBuffer(buffer: Buffer, length?: number): string {
    length = length || Math.ceil(buffer.length * 8 / 6);
    var chars = new Array(length);

    var i = 1; // start at 1 to avoid subtracting by 1
    var bufferIndex = buffer.length - 1;
    var hang = 0;
    do {
        var bufferByte;
        switch (i % 4) {
            case 1:
                bufferByte = buffer[bufferIndex--];
                chars[chars.length - i] = ALPHABET[bufferByte & 0x3F];
                hang = bufferByte >> 6;
                break;
            case 2:
                bufferByte = buffer[bufferIndex--];
                chars[chars.length - i] = ALPHABET[((bufferByte & 0x0F) << 2) | hang];
                hang = bufferByte >> 4;
                break;
            case 3:
                bufferByte = buffer[bufferIndex--];
                chars[chars.length - i] = ALPHABET[((bufferByte & 0x03) << 4) | hang];
                hang = bufferByte >> 2;
                break;
            case 0:
                chars[chars.length - i] = ALPHABET[hang];
                break;
        }
        i++;
    } while (bufferIndex >= 0 && i <= chars.length);

    if ((i % 4) !== 1) {
        chars[chars.length - i] = ALPHABET[hang];
        i++;
    }
    while (i <= chars.length) {
        chars[chars.length - i] = ALPHABET[0];
        i++;
    }

    return chars.join('');
}

export function encodeInt(num: number, length?: number) {
    if (length) {
        var bounds = Math.pow(2, 6 * length);
        if (num >= bounds) {
            throw new Error('Int (' + num + ') is greater than or equal to max bound (' + bounds + ') for encoded string length (' + length + ')');
        }
    } else {
        var log = Math.log2(num);
        if (Math.pow(2, Math.round(log)) === num) {
            log++;
        }
        length = Math.max(1, Math.ceil(log / BASE_BITS));
    }

    var chars = new Array(length);
    var i = chars.length - 1;
    while (num > 0) {
        chars[i--] = ALPHABET[num % BASE];
        num = Math.floor(num / BASE);
    }
    while (i >= 0) {
        chars[i--] = ALPHABET[0];
    }
    return chars.join('');
}

export function decodeToBuffer(string: string, bytes: Array<any>) {
    var i = 1; // start at 1 to avoid subtracting by 1
    var buffer = Buffer.from(bytes || Math.ceil(string.length * BASE_BITS / 8));
    var bufferIndex = buffer.length - 1;
    do {
        var dec = ALPHABET_FLIPPED[string[string.length - i]];
        switch (i % 4) {
            case 1:
                buffer[bufferIndex] = dec;
                break;
            case 2:
                buffer[bufferIndex--] |= (dec & 0x3) << 6;
                buffer[bufferIndex] = dec >> 2;
                break;
            case 3:
                buffer[bufferIndex--] |= (dec & 0xF) << 4;
                buffer[bufferIndex] = dec >> 4;
                break;
            case 0:
                buffer[bufferIndex--] |= dec << 2;
                break;
        }
        i++;
    } while (bufferIndex >= 0 && i <= string.length);

    if (i % 4 === 1) {
        bufferIndex++;
    }
    if (bufferIndex > 0) {
        buffer.fill(0, 0, bufferIndex);
    }

    return buffer;
}

export function decodeToInt(string: string) {
    let i: number = 0;
    let num: number = 0;

    do {
        num = num * BASE + ALPHABET_FLIPPED[string[i]];
        i++;
    } while (i < string.length);

    return num;
}

const radix64 = { encodeBuffer, encodeInt, decodeToBuffer, decodeToInt };
export default radix64;