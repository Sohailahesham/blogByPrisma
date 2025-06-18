import { Router } from "express";
import {
  addCommentValidation,
  addPostValidation,
  idParamValidation,
  queryValidation,
  updatePostValidation,
  updatePublishValidation,
} from "../middlewares/validationArrays";
import { validator } from "../middlewares/validation";
import { asyncWrapper } from "../middlewares/wrapper";
import verifyToken from "../middlewares/verifyToken";
import {
  createPost,
  deleteAllPosts,
  deletePost,
  getAllPublishedPosts,
  getAllUserPosts,
  getPostById,
  updatePost,
  getAllPosts,
  updatePublish,
} from "../controllers/post.controller";
import {
  addComment,
  getAllApprovedCommentsOfPost,
  getAllCommentsOfPost,
} from "../controllers/comments.controller";
import allowedTo from "../middlewares/allowedTo";

const router = Router();

router
  .route("/")
  .get(asyncWrapper(getAllPublishedPosts))
  .post(verifyToken, addPostValidation, validator, asyncWrapper(createPost))
  .delete(verifyToken, asyncWrapper(deleteAllPosts));

router
  .route("/all")
  .get(verifyToken, allowedTo("ADMIN"), asyncWrapper(getAllPosts));

router.route("/user/:userId").get(asyncWrapper(getAllUserPosts));

router
  .route("/:id")
  .all(idParamValidation, validator)
  .get(asyncWrapper(getPostById))
  .put(verifyToken, updatePostValidation, validator, asyncWrapper(updatePost))
  .delete(verifyToken, asyncWrapper(deletePost));

router
  .route("/:id/comments")
  .all(verifyToken, idParamValidation, validator)
  .get(asyncWrapper(getAllApprovedCommentsOfPost))
  .post(addCommentValidation, validator, asyncWrapper(addComment));

router
  .route("/:id/comments/all")
  .get(
    verifyToken,
    queryValidation,
    validator,
    asyncWrapper(getAllCommentsOfPost)
  );

router
  .route("/:id/publish")
  .patch(
    verifyToken,
    allowedTo("ADMIN"),
    idParamValidation,
    validator,
    updatePublishValidation,
    validator,
    asyncWrapper(updatePublish)
  );
export default router;
