import { body, param, query } from "express-validator";

//auth
const registerValidation = [
  body("username")
    .notEmpty()
    .withMessage("username is required")
    .isLength({ min: 3 })
    .withMessage("name must be at least 3 characters long")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("Username can only contain letters and numbers"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email"),
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[@$!%*?&_]/)
    .withMessage(
      "Password must contain at least one special character (@, $, !, %, *, ?, &, _)"
    )
    .not()
    .matches(/\s/)
    .withMessage("Password must not contain spaces"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

//user
const emailValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Must be a valid email"),
];

const updateRoleValidation = [
  param("id")
    .notEmpty()
    .withMessage("ID is required")
    .isUUID()
    .withMessage("Invalid UUID"),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .bail()
    .isIn(["USER", "ADMIN"])
    .withMessage("This role is not allowed"),
];

const idParamValidation = [
  param("id")
    .notEmpty()
    .withMessage("ID is required")
    .isUUID()
    .withMessage("Invalid UUID"),
];

const updateUserValidation = [
  body("username")
    .optional()
    .isString()
    .withMessage("Username must be a string")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("Username can only contain letters and numbers"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Must be a valid email")
    .normalizeEmail(),
  body("oldPassword").optional(),
  body("newPassword")
    .optional()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("New password must contain at least one number")
    .matches(/[@$!%*?&_]/)
    .withMessage(
      "New password must contain at least one special character (@, $, !, %, *, ?, &, _)"
    )
    .not()
    .matches(/\s/)
    .withMessage("New Password must not contain spaces")
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error("New password must be different from old password");
      }
      return true;
    }),
];

//posts
const addPostValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters long"),

  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "TECHNOLOGY",
      "LIFESTYLE",
      "TRAVEL",
      "FOOD",
      "HEALTH",
      "FINANCE",
      "EDUCATION",
      "ENTERTAINMENT",
    ])
    .withMessage("Category must be a valid value"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings")
    .custom((value) => {
      if (value.length > 5) {
        throw new Error("You can only add up to 5 tags");
      }
      return true;
    })
    .custom((value) => {
      for (const tag of value) {
        if (typeof tag !== "string") {
          throw new Error("Tags must be strings");
        }
      }
      return true;
    }),
];

const updatePostValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters long"),

  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long"),

  body("category")
    .optional()
    .isString()
    .withMessage("Category must be a string")
    .isIn([
      "TECHNOLOGY",
      "LIFESTYLE",
      "TRAVEL",
      "FOOD",
      "HEALTH",
      "FINANCE",
      "EDUCATION",
      "ENTERTAINMENT",
    ])
    .withMessage("Category must be a valid value"),
];

const updatePublishValidation = [
  body("published")
    .notEmpty()
    .withMessage("Published status is required")
    .isBoolean()
    .withMessage("Published must be a boolean value"),
];

//comments
const addCommentValidation = [
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 1 })
    .withMessage("Content must be at least 1 character long"),
];
const updateCommentValidation = [
  body("content")
    .optional()
    .isString()
    .withMessage("Content must be a string")
    .isLength({ min: 1 })
    .withMessage("Content must be at least 1 character long"),
];

//tags
const addTagValidation = [
  body("name")
    .notEmpty()
    .withMessage("Tag name is required")
    .isString()
    .withMessage("Tag name must be a string")
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Tag name must be between 2 and 30 characters")
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage(
      "Tag name must be alphanumeric and may include dashes or underscores"
    ),
];

const updateTagValidation = [
  body("name")
    .optional()
    .isString()
    .withMessage("Tag name must be a string")
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Tag name must be between 2 and 30 characters")
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage(
      "Tag name must be alphanumeric and may include dashes or underscores"
    ),
];

// query validation
const queryValidation = [
  query("approved")
    .optional()
    .isBoolean()
    .withMessage("Approved must be a boolean (true/false)")
    .toBoolean(),

  query("userEmail")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

export {
  registerValidation,
  loginValidation,
  emailValidation,
  updateRoleValidation,
  updateUserValidation,
  idParamValidation,
  addPostValidation,
  updatePostValidation,
  addCommentValidation,
  updateCommentValidation,
  addTagValidation,
  updateTagValidation,
  updatePublishValidation,
  queryValidation,
};
