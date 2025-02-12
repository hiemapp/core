const PM_REGEX = /pm/gi;
const NUMBER_REGEX = /[0-9]+/g;

class TimeParser {
    /**
     * Parses a time string and returns the value in milliseconds.
     * @param source The source string.
     * @returns The time, formatted as 1:0:0.
     */
    static parse(source: unknown) {
        if(typeof source !== 'string') 
            throw 'Time must be a string.'

        let [ hours, minutes, seconds ] = this.getNumbers(source)
        hours += this.getMeridiemOffset(source);

        const milliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
        return milliseconds;
    }

    protected static getNumbers(source: string): [number, number, number] {
        const items = source.match(NUMBER_REGEX) ?? [];
        const numbers = items.map(i => parseInt(i));

        while (numbers.length < 3) numbers.push(0);
        return numbers as any;
    }

    protected static getMeridiemOffset(source: string) {
        return PM_REGEX.test(source) ? 12 : 0;
    }
}

export { TimeParser as TimeParser_SA }