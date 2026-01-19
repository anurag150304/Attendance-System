import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().min(1, { error: "Name is required!" }),
    email: z.email({ error: "Invalid email" }).min(1, { error: "Email is required!" }),
    password: z.string().min(6, { error: "Password must atleast 6 characters required!" }),
    role: z.enum(["teacher", "student"], { error: "Invalid role type" })
}).strict();

export const signinSchema = z.object({
    email: z.email({ error: "Invalid email" }).min(1, { error: "Email is required!" }),
    password: z.string().min(6, { error: "Password must atleast 6 characters required!" }),
}).strict();

export type UserSchema = z.infer<typeof signupSchema>