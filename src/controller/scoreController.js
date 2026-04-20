import {prisma as db} from '../lib/prisma.js';

const scoreController = {
    win: async (req, res, next) => {
        const { winnerId } = req.body;

        if (!winnerId) return next({
            status: 400,
            message: "Parâmetro winnerId é necessário"
        })

        try {
            let newScore = await db.score.findFirst({
                where: { userId: winnerId },
            })

            if (!newScore) {
                newScore = await db.score.create({
                    data: {
                        userId: winnerId,
                        victories: 1,
                        draw: 0
                    }
                })
            } else {
                newScore = await db.score.update({
                    where: { userId: winnerId },
                    data: {
                        id: newScore.id,
                        userId: winnerId,
                        victories: { increment: 1 },
                        draw: newScore.draw
                    }
                })
            }

            return res.status(200).json(newScore)

        } catch (e) {
            next(e)
        }
    },

    draw: async (req, res, next) => {
        const { player1Id, player2Id } = req.body;

        if (!player1Id || !player2Id) return next({
            status: 400,
            message: "Parâmetro player1Id e player1Id são necessários"
        })
        const results = [];
        try {
            const playersIds = [player1Id, player2Id];

            for (const playerId of playersIds) {
                let newScore = await db.score.findFirst({
                    where: { userId: playerId },
                })

                if (!newScore) {
                    newScore = await db.score.create({
                        userId: playerId,
                        victories: 0,
                        draw: 1
                    })
                } else {
                    newScore = await db.score.update({
                        where: { userId: playerId },
                        data: {
                            id: newScore.id,
                            userId: playerId,
                            victories: newScore.victories,
                            draw: { increment: 1 }
                        }
                    })
                }
                results.push(newScore);

            }

            res.status(200).json(results);

        } catch (e) {
            next(e)
        }
    },

    ranking: async (req, res, next) => {
        try {
            const rank = await db.score.findMany({
                orderBy: [
                    { victories: 'desc' },
                    { draw: 'desc' }
                ],
                include: {
                    user: true
                }
            });

            return res.json(rank);
        } catch (error) {
            next(error);
        }
    }
}

export default scoreController