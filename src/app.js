import express from 'express';
import authRoutes from "./routes/authRoutes.js";
import {trackingMiddleware} from "./config/middlewares/trackingMiddleware.js";

const app = express();

app.use(express.json());

app.use(trackingMiddleware)
app.use('/api/auth', authRoutes);