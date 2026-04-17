import { prisma as db } from '../lib/prisma.js'
import {UserStatus} from "@prisma/client";
export async function broadcastOnlinePlayers(io) {
    const users = await db.user.findMany({
        where: { status: UserStatus.ONLINE },
        select: { id: true, username: true }
    });

    io.emit('playersOnlineUpdated', users);
}


export const setUserOffline = async (userId) => {
    await db.user.update({
        where: { id: userId },
        data: {
            tokenVersion: {
                increment: 1
            },
            status: UserStatus.OFFLINE
        }
    });
};