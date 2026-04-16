import express from "express";
import {authMiddleware} from "../config/middlewares/auth.js";
import scoreController from "../controller/scoreController.js";
const router = express.Router();

router.get("/", authMiddleware, scoreController.ranking)
router.post("/win", authMiddleware, scoreController.win)
router.post("/draw", authMiddleware, scoreController.draw)


export default router;