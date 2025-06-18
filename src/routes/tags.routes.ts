import { Router } from "express";
import {
  addTagValidation,
  idParamValidation,
  updateTagValidation,
} from "../middlewares/validationArrays";
import { validator } from "../middlewares/validation";
import { asyncWrapper } from "../middlewares/wrapper";
import verifyToken from "../middlewares/verifyToken";
import {
  createTag,
  deleteTag,
  getAllTags,
  getTagById,
  getTagByName,
  updateTag,
} from "../controllers/tags.controller";
import allowedTo from "../middlewares/allowedTo";

const router = Router();
router
  .route("/")
  .get(verifyToken, asyncWrapper(getAllTags))
  .post(
    verifyToken,
    allowedTo("ADMIN"),
    addTagValidation,
    validator,
    asyncWrapper(createTag)
  );

router
  .route("/id/:id")
  .get(verifyToken, idParamValidation, validator, asyncWrapper(getTagById))
  .put(
    verifyToken,
    allowedTo("ADMIN"),
    idParamValidation.concat(updateTagValidation),
    validator,
    asyncWrapper(updateTag)
  )
  .delete(
    verifyToken,
    allowedTo("ADMIN"),
    idParamValidation,
    validator,
    asyncWrapper(deleteTag)
  );
router.route("/name/:name").get(verifyToken, asyncWrapper(getTagByName));
export default router;
