import {prisma as db} from '../lib/prisma.js';
const memoryBoards = {};
import {MatchInviteStatus, UserStatus} from "@prisma/client";

const gameController = {
    create: async (req, res, next) => {
        const {userId} = req.user;

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
                    where: {id: userId},
                    data: {status: 'IN_MATCH'}
                });

                return {match, userMatch};
            });

            res.status(201).json({
                message: "Partida criada e jogador conectado.",
                matchId: result.match.id,
                userMatchId: result.userMatch.id
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({error: "Erro ao criar partida."});
            next(e)
        }
    },

    joinMatch: async (req, res, next) => {
        const {userId} = req.user;
        const {matchId} = req.body;

        if (!matchId) {
            return next({
                status: 400,
                message: "matchId é obrigatório"
            })
        }

        try {
            const match = await db.match.findUnique({
                where: {id: matchId},
                include: {User_Match: true}
            });

            if (!match) {
                return next({
                    status: 404,
                    message: "Partida não encontrada"
                })
            }

            if (match.status !== 'WAITING') return next({status: 400, error: "Esta partida já começou ou terminou."});

            const alreadyIn = match.User_Match.some(m => m.userId === userId);
            if (alreadyIn) return next({status: 400, error: "Você já está nesta partida."});

            const result = await db.$transaction(async (tx) => {
                const newUserMatch = await tx.user_Match.create({
                    data: {
                        userId: userId,
                        matchId: matchId
                    }
                });

                await tx.user.update({
                    where: {id: userId},
                    data: {status: 'IN_MATCH'}
                });

                return newUserMatch;
            });

            if (req.io) {
                req.io.to(matchId).emit("playerJoined", {userId});
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
        const {userId} = req.user;
        const {matchId} = req.body;

        try {
            await db.$transaction([
                db.user_Match.deleteMany({
                    where: {userId, matchId}
                }),
                db.user.update({
                    where: {id: userId},
                    data: {status: 'ONLINE'}
                })
            ]);

            res.status(200).json({message: 'Você saiu da partida.'});
        } catch (error) {
            next(error);
        }
    },

    playTurn: async (req, res, next) => {
        const { userId } = req.user;
        const { matchId, position } = req.body;


        try {
            const match = await db.match.findUnique({
                where: { id: matchId },
                include: { User_Match: true }
            });

            if (!match) return res.status(404).json({ error: "Match not found" });
            if (match.status !== "ON_GOING") return res.status(400).json({ error: "Match is not active" });
            if (match.currentPlayerId !== userId) return res.status(403).json({ error: "It's not your turn" });

            if (!memoryBoards[matchId]) {
                memoryBoards[matchId] = Array(9).fill(null);
            }
            const board = memoryBoards[matchId];

            if (board[position] !== null) return res.status(400).json({ error: "Position already taken" });

            board[position] = userId;

            const winnerId = checkWin(board);
            const isDraw = !winnerId && board.every(cell => cell !== null);

            if (winnerId || isDraw) {
                await db.match.update({
                    where: { id: matchId },
                    data: { status: "FINISHED", currentPlayerId: null }
                });

                if (winnerId) {
                    await db.score.updateMany({
                        where: { userId: winnerId },
                        data: { victories: { increment: 1 } }
                    });
                } else if (isDraw) {
                    const playerIds = match.User_Match.map(um => um.userId);
                    await db.score.updateMany({
                        where: { userId: { in: playerIds } },
                        data: { draw: { increment: 1 } }
                    });
                }

                delete memoryBoards[matchId];

                if (req.io) {
                    req.io.to(matchId).emit("gameOver", { winnerId, isDraw, finalBoard: board });
                }

                return res.status(200).json({ message: "Game over" });
            }

            const nextPlayer = match.User_Match.find(um => um.userId !== userId);

            await db.match.update({
                where: { id: matchId },
                data: { currentPlayerId: nextPlayer.userId }
            });

            if (req.io) {
                req.io.to(matchId).emit("gameStateUpdated", {
                    board,
                    nextPlayerId: nextPlayer.userId,
                    lastPlay: position
                });
            }

            res.status(200).json({ message: "Turn played successfully", nextPlayer: nextPlayer.userId });
        } catch (e) {
            next(e);
        }
    },

    getNextPlayerId: async (gameId, currentUserId) => {
        const players = await db.Match.findMany({where: {id: gameId}});
        return players.filter(p => p.id !== currentUserId)[0].id;
    },

    invitePlayer: async (req, res, next) => {
        const { userId } = req.user;
        const { matchId, userGuestId } = req.body;

        if(!matchId || !userGuestId) return next({
            status: 400,
            message: "matchId e userGuestId são necessários"
        })

        try {
            // Retorna a partida se além dela existir, o usuário que convidou também está inserido nela.
            const match = await db.match.findFirst({
                where: {
                    id: matchId,
                    User_Match: {
                        some: { userId }
                    }
                }
            });

            if (!match) {
                return next({
                    status: 400,
                    message: "Partida não encontrada ou usuário não está nela"
                });
            }

            if (userId === userGuestId) {
                return next({
                    status: 400,
                    message: "Você não pode convidar a si mesmo"
                });
            }

            const isOnline = await db.user.findFirst({
                where: {
                    id: userGuestId,
                    status: UserStatus.ONLINE
                }
            })

            if (!isOnline) return next({
                status: 400,
                message: "usuário convidado não está online"
            })

            const invite = await db.$transaction(async (tx) => {
                return tx.matchInvite.upsert({
                    where: {
                        matchId_invitedId: {
                            matchId,
                            invitedId: userGuestId
                        }
                    },
                    update: {
                        status: MatchInviteStatus.PENDING,
                        invitedBy: userId
                    },
                    create: {
                        matchId,
                        invitedId: userGuestId,
                        invitedBy: userId,
                        status: MatchInviteStatus.PENDING
                    }
                });
            });

            return res.status(200).json({
                message: "Convite enviado com sucesso",
                invite
            });

        } catch (err) {
            next(err)
        }

    },

    declineInvite: async (req, res, next) => {
        const { userId } = req.user;
        const { matchId } = req.body;

        try {
            const invite = await db.matchInvite.findUnique({
                where: {
                    matchId_invitedId: {
                        matchId,
                        invitedId: userId
                    }
                }
            });

            if (!invite) {
                return next({
                    status: 404,
                    message: "Convite não encontrado"
                });
            }

            if (invite.status !== "PENDING") {
                return next({
                    status: 400,
                    message: "Convite já foi respondido"
                });
            }

            const updatedInvite = await db.matchInvite.update({
                where: {
                    matchId_invitedId: {
                        matchId,
                        invitedId: userId
                    }
                },
                data: {
                    status: "DECLINED"
                }
            });

            return res.status(200).json({
                message: "Convite recusado com sucesso",
                invite: updatedInvite
            });

        } catch (err) {
            console.error(err);
            return next({
                status: 500,
                message: "Erro ao recusar convite"
            });
        }
    }
};

export default gameController;