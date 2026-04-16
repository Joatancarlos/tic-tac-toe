import { prisma as db } from '../lib/prisma.js'
export async function broadcastOnlinePlayers(io) {
    const users = await db.user.findMany({
        where: { status: 'ONLINE' },
        select: { id: true, username: true }
    });

    io.emit('playersOnlineUpdated', users);
}