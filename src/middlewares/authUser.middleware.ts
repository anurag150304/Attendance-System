import type { Request, Response, NextFunction } from "express";
import { errHandler } from "../types/errHandler.type.js";
import type { IRequest, JWTPayload } from "../types/common.type.js";
import { verifyToken } from "../utils/common.util.js";
import userDB from "../models/user.model.js";

export async function authUser(req: Request, _: Response, next: NextFunction) {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];
    if (!token) throw new errHandler(401, "Unauthorized, token missing or invalid!");

    let decodedData: JWTPayload | null = null;;
    try {
        decodedData = verifyToken(token);
        if (!decodedData) throw new errHandler(401, "Invalid token payload");
    } catch (err) {
        throw new errHandler(400, "Failed to verify access token or token is expired!");
    }

    const user = await userDB.findById(decodedData.userId);
    if (!user) throw new errHandler(404, "Unauthorized! User not found.");

    (req as IRequest).user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
    return next();
}