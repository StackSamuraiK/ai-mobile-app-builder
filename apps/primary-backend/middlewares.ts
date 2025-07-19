import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            msg: "Unauthorized user"
        });
    }


    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
        const decoded = jwt.verify(cleanToken, process.env.JWT_PUBLIC_KEY || "" , {algorithms:["RS256"]}) as jwt.JwtPayload;

        if (!decoded) {
            return res.status(401).json({
                msg: "Unauthorized user"
            });
        }

        const userId = decoded.sub || (decoded as any).payload?.sub;

        if (!userId) {
            return res.status(401).json({
                msg: "Unauthorized user"
            });
        }

        req.userId = userId;

        next();
    } catch (error) {
        return res.status(401).json({
            msg: "Invalid token"
        });
    }
}