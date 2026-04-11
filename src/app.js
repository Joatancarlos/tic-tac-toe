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




io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Quando o frontend pedir para entrar na sala da partida
    socket.on("joinRoom", (matchId) => {
        socket.join(matchId);
        console.log(`Socket ${socket.id} entrou na sala da partida: ${matchId}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
})