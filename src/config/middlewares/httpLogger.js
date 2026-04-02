import {addLogToQueue} from "../../queues/logQueue.js";

export const httpLogger = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        req.responseTime = Date.now() - start;

        const log = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode || 500,
            responseTime: req.responseTime,
            ip: req.ip,
            userAgent: req.headers["user-agent"] || null,
        };

        addLogToQueue(log);
    });
    next();
};