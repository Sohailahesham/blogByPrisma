import { Router } from "express";
import { asyncWrapper } from "../middlewares/wrapper";
import {
  deleteUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  getUserProfile,
  updateRole,
  updateUserProfile,
} from "../controllers/user.controller";
import allowedTo from "../middlewares/allowedTo";
import verifyToken from "../middlewares/verifyToken";
import {
  emailValidation,
  idParamValidation,
  updateRoleValidation,
  updateUserValidation,
} from "../middlewares/validationArrays";
import { validator } from "../middlewares/validation";
import { getAllUserComments } from "../controllers/comments.controller";
import { updateUserLimiter } from "../middlewares/rateLimit";

const router = Router();

// User routes
router
  .route("/")
  .get(verifyToken, allowedTo("ADMIN"), asyncWrapper(getAllUsers));

router
  .route("/me")
  .all(verifyToken)
  .get(asyncWrapper(getUserProfile))
  .put(
    updateUserValidation,
    validator,
    updateUserLimiter,
    asyncWrapper(updateUserProfile)
  );

router
  .route("/email")
  .get(
    verifyToken,
    allowedTo("ADMIN"),
    emailValidation,
    validator,
    asyncWrapper(getUserByEmail)
  );

router
  .route("/:id")
  .all(idParamValidation, validator)
  .get(asyncWrapper(getUserById))
  .delete(verifyToken, asyncWrapper(deleteUser));

router
  .route("/:id/role")
  .patch(
    verifyToken,
    allowedTo("ADMIN"),
    idParamValidation,
    validator,
    updateRoleValidation,
    validator,
    asyncWrapper(updateRole)
  );

router
  .route("/:id/comments")
  .get(
    verifyToken,
    allowedTo("ADMIN"),
    idParamValidation,
    validator,
    asyncWrapper(getAllUserComments)
  );

export default router;
