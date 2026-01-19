import type { Request, Response, NextFunction } from "express";
import { errHandler } from "../types/errHandler.type.js";
import type { IRequest } from "../types/common.type.js";
import { validateUser } from "../utils/authUtils.js";

export async function authUser(req: Request, _: Response, next: NextFunction) {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];
    if (!token) throw new errHandler(401, "Unauthorized, token missing or invalid!");

    let user;
    try {
        try {
            // decodedData = verifyToken(token);
        } catch (err) {
            throw new errHandler(400, "Failed to verify access token or token is expired!")
        }

        // user = await userDB.findById(decodedData.userId);
        if (!user) throw new errHandler(404, "Unauthorized! User not found.");
        return user;
    } catch (err) { throw new errHandler(401, (err as errHandler).message); }

    (req as IRequest).user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
    return next();
}