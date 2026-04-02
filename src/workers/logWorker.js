import { prisma } from "../lib/prisma.js";

export const saveLogsBatch = async (logs) => {
    if (!logs.length) return;

    await prisma.httpLog.createMany({
        data: logs
    });
};