// import { createLogger, addColors, format, transports } from 'winston';
// import * as _ from 'lodash';
// const  { combine, errors, simple, colorize, timestamp, printf } = format;
import dayjs from 'dayjs';
import * as kolorist from 'kolorist';
import _ from 'lodash';

export interface ILoggerOptions {
    level?: 'error' | 'warn' | 'notice' | 'info' | 'debug',
    label?: string,
    meta?: Object,
    err?: Error
}

export default class Logger {
    defaultOptions: ILoggerOptions = {
        level: 'info',
        label: 'System'
    }

    colors = {
        error: kolorist.red,
        warn: kolorist.yellow,
        notice: kolorist.blue,
        info: kolorist.green,
        debug: kolorist.magenta
    }

    constructor(defaultOptions?: ILoggerOptions) {
        if(defaultOptions) {
            this.defaultOptions = defaultOptions;
        }
    }

    child(defaultOptions?: ILoggerOptions) {
        return new Logger(defaultOptions);
    }

    print(data: string | Error, options: ILoggerOptions) {
        options = _.defaults(options, this.defaultOptions);
        const line = [];
        let message: string;

        // MESSAGE
        if(data instanceof Error) {           
            message = data.message;
        } else if(options.err instanceof Error) {
            message = `${_.trimEnd(data, ': ')}: ${options.err.message}`;
        } else {
            message = data;
        }


        // TIME
        const time = this.getTimeString();
        line.push(time);

        // LABEL
        const label = _.trimEnd(_.trimStart(options.label, '['), ']');
        line.push('['+label+']');

        // LEVEL
        const level = this.colors[options.level!](options.level!);
        line.push(level+':');
        
        // MESSAGE
        line.push(message);

        // META
        if(options.meta) {
            const meta = JSON.stringify(options.meta);
            line.push(meta);
        }

        console.log(line.join(' '));

        // Log error stack
        if(process.env.NODE_ENV === 'development') {
            if(data instanceof Error && data.stack) {
                console.error(data.stack.slice(7 + data.message.length + 1));
            } else if(options.err instanceof Error && options.err.stack) {
                console.error(options.err.stack.slice(7 + options.err.message.length + 1));
            }
        }
    }

    getTimeString() {
        return kolorist.italic(kolorist.gray(dayjs().format('HH:mm:ss.SSS')));
    }

    error(message: string | Error, options: ILoggerOptions = {}) {
        this.print(message, { ...options, level: 'error' });
    }

    warn(message: string, options: ILoggerOptions = {}) {
        this.print(message, { ...options, level: 'warn' });
    }

    info(message: string, options: ILoggerOptions = {}) {
        this.print(message, { ...options, level: 'info' });
    }

    notice(message: string, options: ILoggerOptions = {}) {
        this.print(message, { ...options, level: 'notice' });
    }

    debug(message: string, options: ILoggerOptions = {}) {
        this.print(message, { ...options, level: 'debug' });
    }
}

const logger = new Logger();
export { logger };

// const consoleFormatter = printf((info: any): string => {
//     if(typeof info.label != 'string') 
//         info.label = 'System';

//     let message = `${info.timestamp} [${info.label}] ${info.level}`;

//     if(info.stack) {
//         message += ': '+info.stack.substring(_.trimStart(info.stack, 'Error: ') + 7);
//     } else {
//         message += ': '+_.trimEnd(info.message, '.')+'.';
//     }
//     if(info.meta) message += ' '+JSON.stringify(info.meta);
    
//     return message;
// })

// const splitMeta = format((info: any): any => {
//     const nonMetaProperties = [ 'level', 'message', 'label', 'timestamp', 'stack' ];
//     const meta = _.omit(info, nonMetaProperties);

//     return {
//         ..._.pick(info, nonMetaProperties),
//         meta: Object.keys(meta).length ? meta : null
//     }
// })

// const ajvErrors = format((info, opts) => {
//     const err = (info.meta ? info.meta['0'] : null);
//     const isAjvError = (
//         _.isPlainObject(err) && 
//         typeof err.instancePath == 'string' && 
//         typeof err.schemaPath == 'string');

//     if(isAjvError) {
//         const keypath = _.trimStart(err.instancePath, '/').replaceAll('/', '.');
//         info.message = _.trimEnd(info.message, ' ')+' ';
//         if(keypath) info.message += `property '${keypath}' `;
//         info.message += err.message;
//     }

//     return info;
// })

// const logger = createLogger({
//     level: 'debug',
//     levels: { error: 0, warn: 1, notice: 2, info: 3, debug: 4 },
//     transports: [
//         new transports.Console({
//             format: combine(
//                 colorize(),
//                 timestamp({
//                     format: 'HH:mm:ss.SSS'
//                 }),
//                 errors({ stack: true }),
//                 splitMeta(),
//                 ajvErrors(),
//                 consoleFormatter
//             )
//         })
//     ]
// })

// addColors({
//     info: 'green',
//     debug: 'magenta',
//     error: 'red',
//     crit: 'bold red',
//     warn: 'yellow',
//     notice: 'blue'
// });

// export default logger;