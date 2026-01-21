import z from "zod";

export const getClassSchema = z.object({
    className: z.string().min(1, { error: "Class name is required!" })
}).strict();

export const addStudentSchema = z.object({
    studentId: z.string().min(1, { error: "Student Id is required!" }).max(12, { error: "Student Id length can not exceeds more than 12" })
}).strict();

export const attendanceSchema = z.object({
    classId: z.string().min(1, { error: "Class Id is required!" }).max(12, { error: "Class Id length can not exceeds more than 12" })
});
