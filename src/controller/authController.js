import {prisma} from "../lib/prisma.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const login = async (req, res) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        {
            userId: user.id,
            tokenVersion: user.tokenVersion
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({ token });
}
const logout = async (req, res) => {
    const { userId } = req.user;

    await prisma.user.update({
        where: { id: userId },
        data: {
            tokenVersion: {
                increment: 1
            }
        }
    });

    res.json({ message: "User logged out successfully" });
};


export {
    login,
    logout
}