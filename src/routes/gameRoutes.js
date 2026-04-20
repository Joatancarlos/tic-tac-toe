import express from "express";
const router = express.Router();
import gameController from "../controller/gameController.js";
import { authMiddleware } from "../config/middlewares/auth.js";


/**
 * @swagger
 * /api/game:
 *   post:
 *     summary: Cria uma nova partida
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Partida criada
 *         content:
 *           application/json:
 *             example:
 *               message: Partida criada e jogador conectado.
 *               matchId: 1
 *               userMatchId: 10
 */

/**
 * @swagger
 * /api/game/join:
 *   post:
 *     summary: Entrar em uma partida
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matchId]
 *             properties:
 *               matchId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Entrou na partida
 *       400:
 *         description: Erro de validação
 *       404:
 *         description: Partida não encontrada
 */

/**
 * @swagger
 * /api/game/leave:
 *   post:
 *     summary: Sair da partida
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Saiu da partida
 */

/**
 * @swagger
 * /api/game/play:
 *   post:
 *     summary: Realiza uma jogada
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matchId, position]
 *             properties:
 *               matchId:
 *                 type: integer
 *                 example: 1
 *               position:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       200:
 *         description: Jogada realizada
 *       400:
 *         description: Jogada inválida
 *       403:
 *         description: Não é seu turno
 */

/**
 * @swagger
 * /api/game/invite:
 *   post:
 *     summary: Convidar jogador para partida
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matchId, userGuestId]
 *             properties:
 *               matchId:
 *                 type: integer
 *               userGuestId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Convite enviado
 */

/**
 * @swagger
 * /api/game/decline-invite:
 *   post:
 *     summary: Recusar convite
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matchId, userId]
 *     responses:
 *       200:
 *         description: Convite recusado
 */

/**
 * @swagger
 * /api/game/accept-invite:
 *   post:
 *     summary: Aceitar convite
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Convite aceito
 */


router.post('/join', authMiddleware, gameController.joinMatch);
router.post('/leave', authMiddleware, gameController.leaveMatch);
router.post('/', authMiddleware, gameController.create);
router.post('/play', authMiddleware, gameController.playTurn);
router.post('/invite', authMiddleware, gameController.invitePlayer);
router.post('/decline-invite', authMiddleware, gameController.declineInvite)
router.post('/accept-invite', authMiddleware, gameController.acceptInvite)

export default router;