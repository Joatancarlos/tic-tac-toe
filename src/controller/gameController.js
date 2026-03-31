import {prisma as db} from '../lib/prisma.js';

const gameController = {
    create: async (req, res, next) => {
        const { userId } = req.user;

        try {
            const result = await db.$transaction(async (tx) => {
                const match = await tx.match.create({
                    data: {
                        status: 'WAITING',
                    }
                });

                const userMatch = await tx.user_Match.create({
                    data: {
                        userId: userId,
                        matchId: match.id
                    }
                });

                await tx.user.update({
                    where: { id: userId },
                    data: { status: 'IN_MATCH' }
                });

                return { match, userMatch };
            });

            res.status(201).json({
                message: "Partida criada e jogador conectado.",
                matchId: result.match.id,
                userMatchId: result.userMatch.id
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: "Erro ao criar partida." });
        }
    },

    joinMatch: async (req, res, next) => {
        const { userId } = req.user;
        const { matchId } = req.body;

        if (!matchId) return res.status(400).json({ error: "matchId é obrigatório" });

        try {
            const match = await db.match.findUnique({
                where: { id: matchId },
                include: { User_Match: true }
            });

            if (!match) return res.status(404).json({ error: "Partida não encontrada." });
            if (match.status !== 'WAITING') return res.status(400).json({ error: "Esta partida já começou ou terminou." });

            const alreadyIn = match.User_Match.some(m => m.userId === userId);
            if (alreadyIn) return res.status(400).json({ error: "Você já está nesta partida." });

            const result = await db.$transaction(async (tx) => {
                const newUserMatch = await tx.user_Match.create({
                    data: {
                        userId: userId,
                        matchId: matchId
                    }
                });

                await tx.user.update({
                    where: { id: userId },
                    data: { status: 'IN_MATCH' }
                });

                return newUserMatch;
            });

            if (req.io) {
                req.io.to(matchId).emit("playerJoined", { userId });
            }

            res.status(201).json({
                message: "Entrou na partida com sucesso.",
                data: result
            });
        } catch (e) {
            next(e);
        }
    },

    leaveMatch: async (req, res, next) => {
        const { userId } = req.user;
        const { matchId } = req.body;

        try {
            await db.$transaction([
                db.user_Match.deleteMany({
                    where: { userId, matchId }
                }),
                db.user.update({
                    where: { id: userId },
                    data: { status: 'ONLINE' }
                })
            ]);

            res.status(200).json({ message: 'Você saiu da partida.' });
        } catch (error) {
            next(error);
        }
    }
};

export default gameController;