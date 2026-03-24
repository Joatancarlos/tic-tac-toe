import { prisma as db } from '../lib/prisma.js'
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const playerController = {
    create: async (req, res, next) => {
        const { username, password } = req.body;

        // Validação simples
        if (!username || !password) {
            return res.status(400).json({ error: 'Fill all fields' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: "The password must be at least 8 characters" });
        }
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        try {
            const result = await db.user.create({ data: { username, password: passwordHash } });
            const { password, ...userSafe } = result;
            res.status(201).json(userSafe);
        } catch (error) {
            next(error);
        }
    },

    getById: async (req, res, next) => {
        const { id } = req.params;
        try {
            const userFound = await db.user.findUnique({
                where: {
                    id
                }
            });

            if (!userFound) {
                return res.status(404).json({ error: 'Player not found' });
            }
            const { password, ...userSafe } = userFound;
            res.json(userSafe);
        } catch (error) {
            next(error);
        }
    },

    update: async (req, res, next) => {
        const { id } = req.params;
        const { username, password } = req.body;

        try {
            const userFound = await db.user.findUnique({
                where: {
                    id
                }
            });
            if (!userFound) return res.status(404).json({ error: 'Player not found' });

            const newPassword = password || userFound.password;
            const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

            const result = await db.user.update({
                where: {
                    id
                },
                data: {
                    username: username || userFound.username,
                    password: passwordHash
                },
            })

            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    delete: async (req, res, next) => {
        const { id } = req.params;
        try {
            await db.user.delete({
                where: {
                    id
                },
            })
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },

    getProfile: async (req, res, next) => {
        try {
            const user = await db.user.findUnique({
                where: { id: req.user.userId },
                select: {
                    id: true,
                    username: true,
                }
            });

            res.json(user);
        } catch (error) {
            next(error);
        }
    }

}

export default playerController;
