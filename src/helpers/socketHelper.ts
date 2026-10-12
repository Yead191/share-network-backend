import colors from "colors";
import { Server, Socket } from "socket.io";
import { logger } from "../shared/logger";

// Map to track active user IDs and their associated socket IDs
const onlineUsers = new Map<string, Set<string>>();

const broadcastOnlineUsers = (io: Server) => {
    const userIds = Array.from(onlineUsers.keys());
    io.emit("online-users", userIds);
};

const registerUserSocket = (io: Server, socket: Socket, userId: string) => {
    if (!userId) return;
    socket.data.userId = userId;
    socket.join(userId);

    let userSockets = onlineUsers.get(userId);
    if (!userSockets) {
        userSockets = new Set();
        onlineUsers.set(userId, userSockets);
    }
    userSockets.add(socket.id);
    broadcastOnlineUsers(io);
    logger.info(colors.green(`User ${userId} registered online (sockets: ${userSockets.size})`));
};

const removeUserSocket = (io: Server, socket: Socket) => {
    const userId = socket.data.userId;
    if (userId && onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId)!;
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            logger.info(colors.yellow(`User ${userId} went offline`));
        }
        broadcastOnlineUsers(io);
    }
};

const socket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        logger.info(colors.blue('A User connected: ' + socket.id));

        const userId = (socket.handshake.query.userId as string) || (socket.handshake.auth?.userId as string);
        if (userId) {
            registerUserSocket(io, socket, userId);
        }

        socket.on("identify", (id: string) => {
            if (id) {
                registerUserSocket(io, socket, id);
            }
        });

        socket.on("get-online-users", () => {
            socket.emit("online-users", Array.from(onlineUsers.keys()));
        });

        socket.on("join-chat", (chatId: string) => {
            if (chatId) {
                socket.join(`chat:${chatId}`);
                logger.info(colors.cyan(`Socket ${socket.id} (user ${socket.data.userId || 'unknown'}) joined chat:${chatId}`));
            }
        });

        socket.on("leave-chat", (chatId: string) => {
            if (chatId) {
                socket.leave(`chat:${chatId}`);
                logger.info(colors.yellow(`Socket ${socket.id} left chat:${chatId}`));
            }
        });

        socket.on("user-logout", (logoutUserId?: string) => {
            const uid = logoutUserId || socket.data.userId;
            if (uid && onlineUsers.has(uid)) {
                onlineUsers.delete(uid);
                broadcastOnlineUsers(io);
            }
            socket.disconnect(true);
        });

        socket.on("track", (data: any) => {
            const { id, location } = data;
            socket.emit(`track::${id}`, location);
        });

        socket.on("disconnect", () => {
            removeUserSocket(io, socket);
            logger.info(colors.red('A user disconnected: ' + socket.id));
        });
    });
};

export const socketHelper = { socket, onlineUsers };
