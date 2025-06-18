import { Router } from "express";
import {
  addCommentValidation,
  idParamValidation,
  updateCommentValidation,
} from "../middlewares/validationArrays";
import { validator } from "../middlewares/validation";
import { asyncWrapper } from "../middlewares/wrapper";
import verifyToken from "../middlewares/verifyToken";
import {
  approveComment,
  deleteComment,
  getAllUserComments,
  getCommentById,
  updateComment,
} from "../controllers/comments.controller";
import allowedTo from "../middlewares/allowedTo";

const router = Router();

router.route("/").all(verifyToken).get(asyncWrapper(getAllUserComments));
router
  .route("/:id")
  .all(verifyToken, idParamValidation, validator)
  .get(asyncWrapper(getCommentById))
  .put(updateCommentValidation, validator, asyncWrapper(updateComment))
  .delete(asyncWrapper(deleteComment));

// comments routes

router
  .route("/:id/approve")
  .patch(
    verifyToken,
    allowedTo("ADMIN"),
    idParamValidation,
    validator,
    asyncWrapper(approveComment)
  );
export default router;
