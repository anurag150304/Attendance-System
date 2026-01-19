import e, { type Express, type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./lib/db.lib.js";
import userRoutes from "./routes/user.route.js";
import type { errHandler } from "./types/errHandler.type.js";

const App: Express = e();
await connectDB();

App.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
App.use(morgan("dev"));
App.use(e.json());

App.get("/", (_: Request, res: Response) => {
    res.status(200).json({ success: true, data: { message: "Welcome to Attendance System API..!" } });
});

App.use("/api/v1/auth", userRoutes);

App.all("*", (_: Request, res: Response) => {
    return res.status(404).json({ success: false, error: "Page Not Found!" });
});

App.use((err: unknown, _: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const { status = 500, message = "Internal server error" } = err as errHandler;
    return res.status(status).json({ success: false, error: message });
});

export default App;