import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { JWTPayload } from "../types/common.type.js";

export const hashPassword = async (password: string) => await bcrypt.hash(password, 10);
export const comparePassword = async (password: string, hashedPassword: string) => await bcrypt.compare(password, hashedPassword);
export const generateToken = (payload: { userId: string; role: "teacher" | "student"; }) => jwt.sign(payload, process.env.JWT_SECRET as string);
export const verifyToken = (token: string) => jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;