import z from "zod";

export const getClassSchema = z.object({
    className: z.string().min(1, { error: "Class name is required!" })
}).strict();
