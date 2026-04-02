import { saveLogsBatch } from '../workers/logWorker.js';

const queue = [];
let processing = false;

export const addLogToQueue = (log) => {
    queue.push(log);

    if (queue.length > 1000) {
        console.warn("Fila de logs muito grande!");
    }
};

const processQueue = async () => {
    if (processing) return;
    processing = true;

    try {
        while (queue.length > 0) {
            const batch = queue.splice(0, 20);
            await saveLogsBatch(batch);
        }
    } catch (err) {
        console.error("Erro ao processar fila:", err);
    } finally {
        processing = false;
    }
};

// roda 1x só
setInterval(() => {
    if (queue.length > 0) processQueue();
}, 5000);