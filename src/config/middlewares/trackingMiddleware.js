import {prisma} from "../../lib/prisma.js";


export function trackingMiddleware(req, res, next) {
    const startTime = process.hrtime()

    res.on('finish', async () => {
        const [seconds, nanoseconds] = process.hrtime(startTime)
        const responseTime = Math.round(seconds * 1000 + nanoseconds / 1e6)

        try {
            await prisma.apiLog.create({
                data: {
                    endpointAccess: req.originalUrl,
                    requestMethod: req.method,
                    statusCode: res.statusCode,
                    responseTime,
                    userId: req.user ? req.user.id : null
                }
            })
        } catch (error) {
            console.error('Erro ao registrar log da API:', error)
        }
    })

    next()
}
