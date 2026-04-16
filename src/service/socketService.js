import { prisma as db } from '../lib/prisma.js'
import {UserStatus} from "@prisma/client";
export async function broadcastOnlinePlayers(io) {
    const users = await db.user.findMany({
        where: { status: UserStatus.ONLINE },
        select: { id: true, username: true }
    });

    io.emit('playersOnlineUpdated', users);
}