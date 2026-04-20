import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import authRoutes from "./routes/authRoutes.js";
import playersRoutes from "./routes/playersRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import {httpLogger} from "./config/middlewares/httpLogger.js";
import errorHandler from "./config/middlewares/errorHandler.js";
import scoreRoutes from "./routes/scoreRoutes.js";
import {Server} from "socket.io";
import cors from 'cors';
import {broadcastOnlinePlayers, setUserOffline} from "./service/socketService.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
let server;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    server = http.createServer(app);
} else {
    const options = {
        key: fs.readFileSync("key.pem"),
        cert: fs.readFileSync("cert.pem")
    };
    server = https.createServer(options, app);
}
const io = new Server(server, {
    cors: {
        origin: [process.env.CLIENT_URL, "https://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
})
app.use(express.json());
app.use(httpLogger)
app.use(cors({
    origin: [process.env.CLIENT_URL, "https://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true }))
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/players', playersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/scoreboard', scoreRoutes);


app.use(errorHandler);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(path.join(__dirname, '../UI'))
const uiPath = path.join(__dirname, '../UI');

app.use(express.static(uiPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(uiPath, 'index.html'));
});

const onlineUsers = new Map();
io.on("connection",   async (socket) => {
    try {
        console.log("Client connected:", socket.id);
        const token = socket.handshake.auth?.token;

        if (!token) {
            return socket.disconnect(true);
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            onlineUsers.set(socket.userId, socket.id);
        } catch (err) {
            socket.disconnect();
        }

        await broadcastOnlinePlayers(io)

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

        socket.on('playersOnlineUpdated',  async () => {
            await broadcastOnlinePlayers(io)

        });

        socket.on("invitePlayer", async (invite) => {
            const invitedSocketId = onlineUsers.get(invite.invitedId);
            console.log("Invite player:", onlineUsers);

            if (invitedSocketId) {
                io.to(invitedSocketId).emit("playerInvited", invite);
            }
        })
    } catch (e) {
        console.error(e);
        socket.disconnect(true);
    }

});
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
})