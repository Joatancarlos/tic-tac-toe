import express from "express";
const router = express.Router();
import gameController from "../controller/gameController.js";
import { authMiddleware } from "../config/middlewares/auth.js";

router.post('/join', authMiddleware, gameController.joinMatch);
router.post('/leave', authMiddleware, gameController.leaveMatch);
router.post('/', authMiddleware, gameController.create);
router.post('/play', authMiddleware, gameController.playTurn);
router.post('/invite', authMiddleware, gameController.invitePlayer);
router.post('/decline-invite', authMiddleware, gameController.declineInvite)
router.post('/accept-invite', authMiddleware, gameController.acceptInvite)

export default router;