import z from "zod";

export const getClassSchema = z.object({
    className: z.string().min(1, { error: "Class name is required!" })
}).strict();

export const addStudentSchema = z.object({
    studentId: z.string().min(1, { error: "Student Id is required!" })
}).strict();

export const attendanceSchema = z.object({
    classId: z.string().min(1, { error: "Class Id is required!" })
});
