import express from 'express';
import authRoutes from "./routes/authRoutes.js";
import {trackingMiddleware} from "./config/middlewares/trackingMiddleware.js";
import playersRoutes from "./routes/playersRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

const app = express();

app.use(express.json());

app.use(trackingMiddleware)
app.use('/api/players', playersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
})