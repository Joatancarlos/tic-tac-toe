import express from 'express';

import authRoutes from "./routes/authRoutes.js";
import playersRoutes from "./routes/playersRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import {httpLogger} from "./config/middlewares/httpLogger.js";
import errorHandler from "./config/middlewares/errorHandler.js";
import scoreRoutes from "./routes/scoreRoutes.js";
import {Server} from "socket.io";
import * as http from "node:http";
import cors from 'cors';
import {broadcastOnlinePlayers, setUserOffline} from "./service/socketService.js";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
})
app.use(express.json());
app.use(httpLogger)
app.use(cors())
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/players', playersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/scoreboard', scoreRoutes);


app.use(errorHandler);




const onlineUsers = new Map();
io.on("connection",   async (socket) => {
    console.log("Client connected:", socket.id);
    const token = socket.handshake.auth?.token;

    console.log(onlineUsers)
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        onlineUsers.set(socket.userId, socket.id);
    } catch (err) {
        socket.disconnect();
    }

    await broadcastOnlinePlayers(io)
    // Quando o frontend pedir para entrar na sala da partida
    socket.on("joinRoom", (matchId) => {
        socket.join(matchId);
        console.log(`Socket ${socket.id} entrou na sala da partida: ${matchId}`);
    });

    socket.on("disconnect",  async () => {
        console.log("Client disconnected:", socket.id);
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            await setUserOffline(socket.userId);
        }
        await broadcastOnlinePlayers(io)
    });

    socket.on('playersOnlineUpdated',  (players) => {
        console.log("método sendo chamado")

    });

    socket.on("invitePlayer", async (invite) => {
        const invitedSocketId = onlineUsers.get(invite.invitedId);
        console.log("Invite player:", onlineUsers);

        if (invitedSocketId) {
            io.to(invitedSocketId).emit("gambiarra", invite);
        }
    })
});
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
})