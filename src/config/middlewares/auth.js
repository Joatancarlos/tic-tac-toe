import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";

export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next({ status: 401, message: "Token not provided" });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
        return next({ status: 401, message: "Invalid token format" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return next({ status: 401, message: "Token invalidated" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return next({ status: 401, message: "Invalid or expired token" });
    }
}
