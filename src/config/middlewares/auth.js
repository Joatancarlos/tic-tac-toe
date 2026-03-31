import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";

export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token not provided" });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ message: "Invalid token format" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({ message: "Token invalidated" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
