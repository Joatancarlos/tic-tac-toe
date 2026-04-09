import express from 'express';

import authRoutes from "./routes/authRoutes.js";
import playersRoutes from "./routes/playersRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import {httpLogger} from "./config/middlewares/httpLogger.js";
import errorHandler from "./config/middlewares/errorHandler.js";

const app = express();

app.use(express.json());
app.use(httpLogger)

app.use('/api/players', playersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
})