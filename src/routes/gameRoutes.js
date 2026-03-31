import express from "express";
const router = express.Router();
import gameController from "../controller/gameController.js";
import { authMiddleware } from "../config/middlewares/auth.js";

router.post('/join', authMiddleware, gameController.joinMatch);
router.post('/', authMiddleware, gameController.create);

export default router;