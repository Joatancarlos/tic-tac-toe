import {addLogToQueue} from "../../queues/logQueue.js";


const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const log = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode || 500,
        responseTime: req.responseTime,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || null,
        userId: req.user?.id || null,
        error: err.message || null,
    };
    console.log(log)
    addLogToQueue(log);

    res.status(err.status || 500).json({
        error: err.message
    });
};

export default errorHandler;