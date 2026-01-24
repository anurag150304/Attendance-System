import type { Document, Types } from "mongoose";
import type { Request } from "express";
import { WebSocket } from "ws";

export interface User extends Document {
    name: string;
    email: string;
    password: string;
    role: "teacher" | "student";
}

export interface Attendance extends Document {
    classId: Types.ObjectId,
    studentId: Types.ObjectId,
    status: "present" | "absent"
}

export interface Class extends Document {
    className: "string";
    teacherId: Types.ObjectId,
    studentIds: Types.ObjectId[]
}

export interface IRequest extends Request {
    user: {
        _id: Types.ObjectId;
        name: string;
        email: string;
        role: "teacher" | "student";
        token: string;
    }
}

export interface JWTPayload {
    userId: string;
    role: "teacher" | "student";
}


export interface ActiveSessionType {
    classId: string;
    startedAt: string;
    attendance: Record<string, "present" | "absent" | "not yet updated">
}

export interface IWebSocket extends WebSocket {
    user: JWTPayload
}