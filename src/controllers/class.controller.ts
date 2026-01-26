import type { Request, Response } from "express";
import { addStudentSchema, getClassSchema } from "../schema/class.schema.js";
import { errHandler } from "../types/errHandler.type.js";
import classDB from "../models/class.model.js";
import type { IRequest, User } from "../types/common.type.js";
import { isValidObjectId, Types } from "mongoose";
import attendanceDB from "../models/attendance.model.js";
import userDB from "../models/user.model.js";

export async function getTeacherClass(req: Request, res: Response) {
    const user = (req as IRequest).user;
    if (user.role !== "teacher") throw new errHandler(403, "Forbidden, teacher access required");

    const parsedData = getClassSchema.safeParse(req.body);
    if (!parsedData.success) throw new errHandler(400, "Invalid request schema");

    const newClass = await classDB.create({
        className: parsedData.data.className,
        teacherId: new Types.ObjectId(user._id),
        studentIds: []
    });

    return res.status(201).json({
        success: true,
        data: {
            _id: newClass.id,
            className: newClass.className.toString(),
            teacherId: newClass.teacherId.toString(),
            studentIds: []
        }
    });

}

export async function addStudent(req: Request, res: Response) {
    const classId = req.params.id;
    if (!classId) throw new errHandler(400, "Class Id is required!");
    if (!isValidObjectId(classId)) throw new errHandler(401, "Invalid class Id");

    const user = (req as IRequest).user;
    if (user.role !== "teacher") throw new errHandler(403, "Forbidden, teacher access required");

    const parsedData = addStudentSchema.safeParse(req.body);
    if (!parsedData.success) throw new errHandler(400, "Invalid request schema");

    const { studentId } = parsedData.data;
    if (!isValidObjectId(studentId)) throw new errHandler(401, "Invalid student Id");

    const existingUser = await userDB.findById(studentId);
    if (!existingUser) throw new errHandler(404, "Student not found");

    const haveClass = await classDB.findById(classId);
    if (!haveClass) throw new errHandler(404, "Class not found");

    const isTeacherOwned = haveClass.teacherId.equals(user._id);
    if (!isTeacherOwned) throw new errHandler(403, "Forbidden, not class teacher");

    let result;
    if (!haveClass.studentIds.map(val => val.toString()).includes(studentId)) {
        try {
            haveClass.studentIds.push(new Types.ObjectId(studentId));
            result = await haveClass.save();
            if (!result) throw new Error("Something went wrong while class allotment!");
        } catch (err) {
            throw new errHandler(500, (err as errHandler).message)
        }
    }

    return res.status(200).json({
        success: true,
        data: {
            _id: result!.id,
            className: result!.className.toString(),
            teacherId: result!.teacherId.toString(),
            studentIds: result!.studentIds.map(st => st.toString())
        }
    })
}

export async function getClassInfo(req: Request, res: Response) {
    const classId = req.params.id;
    if (!classId) throw new errHandler(400, "Class Id is required!");
    if (!isValidObjectId(classId)) throw new errHandler(401, "Invalid class Id");

    const classInfo = await classDB.findById(classId).populate<{ studentIds: User[] }>("studentIds");
    if (!classInfo) throw new errHandler(404, "Class not found");

    const { _id, role } = (req as IRequest).user;
    let isValidUser: boolean | null = null;

    switch (role) {
        case "teacher":
            isValidUser = classInfo.teacherId.equals(_id);
            break;
        case "student":
            isValidUser = classInfo.studentIds.some(st => st._id.equals(_id));
            break;
        default: throw new errHandler(401, "Invalid role!");
    }
    if (!isValidUser)
        throw new errHandler(403, role === "teacher" ? "Forbidden, not class teacher" : "Forbidden, must be enrolled in the class");

    return res.status(200).json({
        success: true,
        data: {
            _id: classInfo.id,
            className: classInfo.className,
            teacherId: classInfo.teacherId,
            students: classInfo.studentIds.map(st => ({ _id: st._id.toString(), name: st.name, email: st.email }))
        }
    });
}

export async function getStudentAttendance(req: Request, res: Response) {
    const classId = req.params.id;
    if (!classId) throw new errHandler(400, "Class Id is required!");
    if (!isValidObjectId(classId)) throw new errHandler(401, "Invalid class Id");

    const user = (req as IRequest).user;
    if (user.role !== "student") throw new errHandler(403, "Forbidden, Student access required");

    const data = await attendanceDB.findOne({ classId, studentId: user._id });
    if (!data) throw new errHandler(403, "Forbidden, You must be enrolled in this class");

    return res.status(200).json({
        success: true,
        data: {
            classId: data.classId.toString(),
            status: data.status || null
        }
    });

}