import { Router } from "express";
import { asyncWrap } from "../utils/asyncWrap.js";
import { authUser } from "../middlewares/authUser.middleware.js";
import { getClass } from "../controllers/class.controller.js";

const router: Router = Router();

router.post("/class", asyncWrap(authUser), asyncWrap(getClass));