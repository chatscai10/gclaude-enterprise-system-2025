/**
 * 即時通訊服務 - GClaude Enterprise System
 */

const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

function initializeSocketIO(server) {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        logger.info(`Socket連線建立: ${socket.id}`);
        
        socket.on('join_room', (room) => {
            socket.join(room);
            logger.info(`用戶加入房間: ${room}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Socket連線斷開: ${socket.id}`);
        });
    });

    logger.info('Socket.IO 即時通訊已啟用');
}

function broadcastNotification(message, room = null) {
    if (!io) return;
    
    if (room) {
        io.to(room).emit('notification', message);
    } else {
        io.emit('notification', message);
    }
}

module.exports = {
    initializeSocketIO,
    broadcastNotification
};