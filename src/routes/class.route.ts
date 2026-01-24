import { Router } from "express";
import { asyncWrap } from "../utils/asyncWrap.js";
import { authUser } from "../middlewares/authUser.middleware.js";
import { addStudent, createTeacherClass, getClassInfo, getStudentAttendance } from "../controllers/class.controller.js";

const router: Router = Router();

router.post("/", asyncWrap(authUser), asyncWrap(createTeacherClass));
router.post("/:id", asyncWrap(authUser), asyncWrap(getClassInfo));
router.post("/:id/add-student", asyncWrap(authUser), asyncWrap(addStudent));
router.get("/:id/my-attendance", asyncWrap(authUser), asyncWrap(getStudentAttendance));

export default router;