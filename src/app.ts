import e, { type Express, type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./lib/db.lib.js";
import userRoutes from "./routes/user.route.js";
import classRoutes from "./routes/class.route.js";
import { errHandler } from "./types/errHandler.type.js";
import { asyncWrap } from "./utils/asyncWrap.js";
import { authUser } from "./middlewares/authUser.middleware.js";
import type { ActiveSessionType, IRequest } from "./types/common.type.js";
import { isValidObjectId } from "mongoose";
import { attendanceSchema } from "./schema/class.schema.js";
import userDB from "./models/user.model.js";
import classDB from "./models/class.model.js";
import cookieParser from "cookie-parser";

export let activeSession: ActiveSessionType | null = null;
export const resetSession = () => activeSession = null;
await connectDB();

const App: Express = e();
App.use(cors());
App.use(morgan("dev"));
App.use(cookieParser());
App.use(e.json());
App.use(e.urlencoded({ extended: true }));

App.get("/", (_: Request, res: Response) => {
    res.status(200).json({ success: true, data: { message: "Welcome to Attendance System API..!" } });
});

App.use("/auth", userRoutes);
App.use("/class", classRoutes);

App.get("/students", asyncWrap(authUser), asyncWrap(async (req: Request, res: Response) => {
    const { _id, role } = (req as IRequest).user;
    if (!isValidObjectId(_id)) throw new errHandler(401, "Invalid class Id");
    if (role !== "teacher") throw new errHandler(403, "Forbidden, Teacher access required");

    const students = await userDB.find({ role: "student" });

    return res.status(200).json({
        success: true,
        data: students.map(st => ({ _id: st.id, name: st.name, email: st.email }))
    });
}));

App.post("/attendance/start", asyncWrap(authUser), asyncWrap(async (req: Request, res: Response) => {
    const user = (req as IRequest).user;
    if (user.role !== "teacher") throw new errHandler(403, "Forbidden, Teacher access required");

    const parsedData = attendanceSchema.safeParse(req.body);
    if (!parsedData.success) throw new errHandler(401, "Invalid request schema");

    const classId = parsedData.data.classId;
    if (!isValidObjectId(classId)) throw new errHandler(401, "Invalid class Id");

    const haveClass = await classDB.findById(classId);
    if (!haveClass) throw new errHandler(404, "Class not found!");

    const isTeacherOwned = haveClass.teacherId.equals(user._id);
    if (!isTeacherOwned) throw new errHandler(403, "Forbidden, You must own this class");
    if (activeSession) throw new errHandler(403, "There is an active session already running");

    const ISODate = new Date().toISOString();
    activeSession = {
        classId: haveClass.id,
        startedAt: ISODate,
        attendance: {}
    }

    return res.status(200).json({
        success: true,
        data: {
            classId: haveClass.id,
            startedAt: ISODate
        }
    });
}));

App.use((err: unknown, _: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const { status = 500, message = "Internal server error" } = err as errHandler;
    return res.status(status).json({ success: false, error: message });
});

export default App;