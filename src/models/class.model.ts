import { Schema, model } from "mongoose";
import type { Class } from "../types/common.type.js";

const classSchema = new Schema<Class>({
    className: {
        type: "string",
        required: true
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    studentIds: {
        type: [Schema.Types.ObjectId],
        ref: "User"
    }
});

const classModel = model("Class", classSchema);
export default classModel;