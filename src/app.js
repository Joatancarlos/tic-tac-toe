import express from 'express';
import authRoutes from "./routes/authRoutes.js";
import {trackingMiddleware} from "./config/middlewares/trackingMiddleware.js";
import playersRoutes from "./routes/playersRoutes.js";

const app = express();

app.use(express.json());

app.use(trackingMiddleware)
app.use('/api/players', playersRoutes);
app.use('/api/auth', authRoutes);