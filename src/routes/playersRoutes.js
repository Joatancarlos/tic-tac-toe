import express from "express";
const router = express.Router();
import playerController from "../controller/playerController.js";
import { authMiddleware } from "../config/middlewares/auth.js";

/**
 * @swagger
 * /api/players:
 *   post:
 *     summary: Cria um novo jogador
 *     tags: [Players]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: joatan
 *               password:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       201:
 *         description: Jogador criado
 *       400:
 *         description: Erro de validação
 */

/**
 * @swagger
 * /api/players/me:
 *   get:
 *     summary: Retorna o perfil do usuário autenticado
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               username: joatan
 */

/**
 * @swagger
 * /api/players/online:
 *   get:
 *     summary: Lista jogadores online
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de jogadores online
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 username: joatan
 */

/**
 * @swagger
 * /api/players/{id}:
 *   get:
 *     summary: Busca jogador por ID
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Jogador encontrado
 *       400:
 *         description: Jogador não encontrado
 */

/**
 * @swagger
 * /api/players/{id}:
 *   put:
 *     summary: Atualiza dados do jogador
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Jogador atualizado
 */

/**
 * @swagger
 * /api/players/{id}:
 *   delete:
 *     summary: Deleta um jogador
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       204:
 *         description: Jogador deletado
 */

router.get('/me', authMiddleware, playerController.getProfile);
router.get('/online', authMiddleware, playerController.getOnlineProfiles);
router.post('/', playerController.create);
router.get('/:id', authMiddleware, playerController.getById);
router.put('/:id', authMiddleware, playerController.update);
router.delete('/:id', authMiddleware, playerController.delete);


export default router;