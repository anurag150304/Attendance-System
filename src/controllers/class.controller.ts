import type { Request, Response } from "express";
import { getClassSchema } from "../schema/class.schema.js";
import { errHandler } from "../types/errHandler.type.js";
import classDB from "../models/class.model.js";
import type { IRequest } from "../types/common.type.js";

export async function getClass(req: Request, res: Response) {
    const user = (req as IRequest).user;
    if (user.role !== "teacher") throw new errHandler(403, "Forbidden, Teacher access required");

    const parsedData = getClassSchema.safeParse(req.body);
    if (!parsedData.success) throw new errHandler(400, "Invalid request schema");

    const haveClass = await classDB.findOne({ className: parsedData.data.className });
    if (!haveClass) throw new errHandler(404, "Class not found!");

    const isTeacherOwned = haveClass.teacherId.equals(user._id);
    if (!isTeacherOwned) throw new errHandler(403, "Forbidden, You do not have access in this class");

    return res.status(200).json({
        success: true,
        data: {
            _id: haveClass.id,
            className: haveClass.className,
            teacherId: haveClass.teacherId.toString(),
            studentIds: haveClass.studentIds.map(st => st.toString())
        }
    });

}

export async function addStudent(req: Request, res: Response) {

}