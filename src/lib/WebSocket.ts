import * as http from 'http';
import { Server } from 'socket.io';
import { Express } from 'express';
import { logger } from './Logger';

export default class WebSocket {
    private static server: Server;

    static setup(app: Express) {
        const server = http.createServer(app);
        this.server = new Server(server);

        this.server.on('connection', socket => {
            logger.debug(`New connection to websocket from address '${socket.handshake.address}'.`);
        })

        return server;
    }

    static emit(event: string, ...args: any[]) {
        if(!this.server) {
            logger.notice('Tried to emit event from unintialized WebSocket.');
            return;
        }
                
        this.server.emit(event, ...args);
    }
}