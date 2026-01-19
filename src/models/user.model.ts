import { Schema, model } from "mongoose";
import type { User } from "../types/common.type.js";

const UserSchema = new Schema<User>({
    name: {
        type: "string",
        required: true
    },
    email: {
        type: "string",
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: "string",
        required: true,
        min: [8, "Passwrod must have atleast 8 digits"],
        select: false
    },
    role: {
        type: "string",
        required: true,
        enum: ["teacher", "student"]
    }
});

const userModel = model("User", UserSchema);
export default userModel;