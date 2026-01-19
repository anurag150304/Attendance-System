import type { Request, Response } from "express";
import { errHandler } from "../types/errHandler.type.js";
import { signinSchema, signupSchema } from "../schema/user.schema.js";
import { comparePassword, generateToken, hashPassword } from "../utils/common.util.js";
import { createUser } from "../services/user.service.js";
import userDB from "../models/user.model.js";
import type { IRequest } from "../types/common.type.js";

export async function signupUser(req: Request, res: Response) {
    const parsedData = signupSchema.safeParse(req.body);
    if (!parsedData.success) throw new errHandler(400, "Invalid request schema");
    const { name, email, password, role } = parsedData.data;

    const existingUser = await userDB.findOne({ email });
    if (existingUser) throw new errHandler(400, "User already exists!");

    const hashedPassword = await hashPassword(password);
    if (!hashPassword) throw new errHandler(500, "Something went wrong while comparing passwords!");

    const user = await createUser({ name, email, password: hashedPassword, role });
    if (!user) throw new errHandler(500, "Something went wrong!");
    return res.status(201).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}

export async function signinUser(req: Request, res: Response) {
    const parsedData = signinSchema.safeParse(req.body);
    if (!parsedData.success) {
        throw new errHandler(400, "Invalid request schema");
    }

    const { email, password } = parsedData.data;

    const existingUser = await userDB.findOne({ email }).select("+password");
    if (!existingUser) throw new errHandler(404, "User not found!");

    const isPassMatched = await comparePassword(password, existingUser.password);
    if (!isPassMatched) throw new errHandler(400, "Invalid Credentials");

    let token: string | null = null;
    try {
        token = generateToken({ userId: existingUser.id, role: existingUser.role });
        if (!token) throw new errHandler(400, "Something went wrong! Try again.");
    } catch (err) {
        throw new errHandler(500, "Failed to generate token!")
    }

    res.cookie("auth_token", token);
    return res.status(200).json({ status: true, data: { token } });
}

export async function signoutUser(_: Request, res: Response) {
    res.clearCookie("auth_token");
    return res.status(200).json({ status: false, message: "User logged out successfully" });
}

export async function profile(req: Request, res: Response) {
    const user = (req as IRequest).user;
    return res.status(200).json({ success: true, data: user });
}