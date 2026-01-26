import type { Request, Response, NextFunction } from "express";
import { errHandler } from "../types/errHandler.type.js";
import type { IRequest, JWTPayload } from "../types/common.type.js";
import { verifyToken } from "../utils/common.util.js";
import userDB from "../models/user.model.js";

export async function authUser(req: Request, _: Response, next: NextFunction) {
    const token: string = req.headers.authorization as string;
    if (!token) throw new errHandler(401, "Unauthorized, token missing or invalid");

    let decodedData: JWTPayload | null = null;
    try {
        decodedData = verifyToken(token);
        if (!decodedData) throw new errHandler(401, "Invalid token payload");
    } catch (err) {
        throw new errHandler(401, "Unauthorized, token missing or invalid");
    }

    const user = await userDB.findById(decodedData.userId);
    if (!user) throw new errHandler(404, "Unauthorized! User not found.");

    (req as IRequest).user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
    }
    return next();
}