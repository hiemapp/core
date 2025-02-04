import { TimeParser_SA } from '../lib/TimeParser.script-api';

export function time_SA(time?: string) {
    if(typeof time !== 'string') {
        const now = new Date();
        time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    }

    return TimeParser_SA.parse(time)
}