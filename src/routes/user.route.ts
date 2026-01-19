import { Router } from "express";
import { asyncWrap } from "../utils/asyncWrap.js";
import { profile, signinUser, signoutUser, signupUser } from "../controllers/user.cotroller.js";
import { authUser } from "../middlewares/authUser.middleware.js";

const router: Router = Router();

router.post("/signup", asyncWrap(signupUser));
router.post("/login", asyncWrap(signinUser));
router.get("/logout", asyncWrap(authUser), asyncWrap(signoutUser));
router.get("/me", asyncWrap(authUser), asyncWrap(profile));
export default Router;