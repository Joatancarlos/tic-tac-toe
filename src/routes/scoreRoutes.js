import express from "express";
import {authMiddleware} from "../config/middlewares/auth.js";
import scoreController from "../controller/scoreController.js";
const router = express.Router();

/**
 * @swagger
 * /api/scoreboard:
 *   get:
 *     summary: Retorna o ranking de jogadores
 *     tags: [Score]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ranking ordenado
 */

/**
 * @swagger
 * /api/scoreboard/win:
 *   post:
 *     summary: Registra vitória de um jogador
 *     tags: [Score]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [winnerId]
 *             properties:
 *               winnerId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Vitória registrada
 *       400:
 *         description: Parâmetro inválido
 */

/**
 * @swagger
 * /api/scoreboard/draw:
 *   post:
 *     summary: Registra empate entre dois jogadores
 *     tags: [Score]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [player1Id, player2Id]
 *             properties:
 *               player1Id:
 *                 type: integer
 *               player2Id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Empate registrado
 */

router.get("/", authMiddleware, scoreController.ranking)
router.post("/win", authMiddleware, scoreController.win)
router.post("/draw", authMiddleware, scoreController.draw)


export default router;