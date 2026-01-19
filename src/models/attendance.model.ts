import { Schema, model } from "mongoose";
import type { Attendance } from "../types/common.type.js";

const attendanceSchema = new Schema<Attendance>({
    classId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    studentId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: "string",
        enum: ["present", "absent"],
        required: true
    }
});

const attendanceModel = model("Attendance", attendanceSchema);
export default attendanceModel;