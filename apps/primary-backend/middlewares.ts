import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    console.log("🔍 Auth middleware called");
    console.log("📋 Headers:", req.headers);
    console.log("🎫 Raw token:", token);

    if (!token) {
        console.log("❌ No token provided");
        return res.status(401).json({
            msg: "Unauthorized user - No token"
        });
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    console.log("🧹 Clean token (first 20 chars):", cleanToken.substring(0, 20) + "...");

    // Log JWT_PUBLIC_KEY info (don't log the full key for security)
    const jwtPublicKey = process.env.JWT_PUBLIC_KEY;
    console.log("🔑 JWT_PUBLIC_KEY exists:", !!jwtPublicKey);
    console.log("🔑 JWT_PUBLIC_KEY length:", jwtPublicKey?.length || 0);
    console.log("🔑 JWT_PUBLIC_KEY starts with:", jwtPublicKey?.substring(0, 30) + "...");

    try {
        console.log("🔄 Attempting to verify token...");
        
        const decoded = jwt.verify(cleanToken, jwtPublicKey || "", {
            algorithms: ["RS256"]
        }) as jwt.JwtPayload;

        console.log("✅ Token verified successfully");
        console.log("📄 Decoded payload:", decoded);

        if (!decoded) {
            console.log("❌ Decoded payload is empty");
            return res.status(401).json({
                msg: "Unauthorized user - Empty payload"
            });
        }

        const userId = decoded.sub;
        console.log("👤 User ID extracted:", userId);

        if (!userId) {
            console.log("❌ No user ID in token");
            return res.status(401).json({
                msg: "Unauthorized user - No user ID"
            });
        }

        req.userId = (userId);
        console.log("✅ Authentication successful, proceeding...");
        next();
        
    } catch (error: any) {
        console.log("❌ JWT verification failed");
        console.log("🚨 Error name:", error.name);
        console.log("🚨 Error message:", error.message);
        console.log("🚨 Full error:", error);
        
        return res.status(401).json({
            msg: "Invalid token",
            error: error.message // Add error details for debugging
        });
    }
}