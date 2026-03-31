import express from "express";

import { logout, login } from "../controller/authController.js"
import { authMiddleware } from "../config/middlewares/auth.js";
const router = express.Router();

router.post("/login", login)
router.post("/logout", authMiddleware, logout);

export default router;