import { Server } from 'socket.io';
let io;
export function initSockets(server) {
    io = new Server(server, { cors: { origin: '*' } });
}
export function ioEmit(channel, payload) { if (io) io.emit(channel, payload); }