import userDB from "../models/user.model.js";
import type { UserSchema } from "../schema/user.schema.js";
import { errHandler } from "../types/errHandler.type.js";

export async function createUser(payload: UserSchema) {
    const { name, email, password, role } = payload;
    if (!name || !email || !password || !role) throw new errHandler(400, "Invalid requested schema");
    return await userDB.create({ name, email, password, role });
}