import { Router } from "express";
import {
  loginValidation,
  registerValidation,
} from "../middlewares/validationArrays";
import { validator } from "../middlewares/validation";
import { asyncWrapper } from "../middlewares/wrapper";
import { login, logout, register } from "../controllers/auth.controller";
import verifyToken from "../middlewares/verifyToken";

const router = Router();

router
  .route("/register")
  .post(registerValidation, validator, asyncWrapper(register));
router.route("/login").post(loginValidation, validator, asyncWrapper(login));
router.route("/logout").post(verifyToken, asyncWrapper(logout));

export default router;
