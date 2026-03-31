import express from "express";
const router = express.Router();
import playerController from "../controller/playerController.js";
import { authMiddleware } from "../config/middlewares/auth.js";

router.get('/me', authMiddleware, playerController.getProfile);
router.get('/online', authMiddleware, playerController.getOnlineProfiles);
router.post('/', playerController.create);
router.get('/:id', authMiddleware, playerController.getById);
router.put('/:id', authMiddleware, playerController.update);
router.delete('/:id', authMiddleware, playerController.delete);


export default router;