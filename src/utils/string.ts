import { v4 as uuidv4 } from 'uuid';

/** 
 * Generates a v4 Uuid without dashes. 
 */
function uuid(): string {
    return uuidv4().replaceAll('-', '');
}

function JSONParseOrFail(string: string, fallback: any = {}) {
    let obj: any;

    try {
        obj = JSON.parse(string);
    } catch(err) {
        obj = fallback;
    }

    return obj;
}

export { uuid, JSONParseOrFail };

