import type { JWTPayload } from "../types/common.type.js";
import { errHandler } from "../types/errHandler.type.js";
import { verifyToken } from "./common.util.js";
import userDB from "../models/user.model.js";

export async function validateUser(token: string) {

}