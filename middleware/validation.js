const { body, param, query, validationResult } = require("express-validator");

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// User validation rules
const validateRegistration = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("position").optional().trim(),
  body("teamId").optional().isInt().withMessage("Team ID must be an integer"),
  handleValidationErrors,
];

const validateLogin = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Username or email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Team validation rules
const validateTeam = [
  body("name").trim().notEmpty().withMessage("Team name is required"),
  body("description").optional().trim(),
  body("memberCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Member count must be a positive integer"),
  body("color")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Color must be a valid hex code"),
  handleValidationErrors,
];

// Task validation rules
const validateTask = [
  body("title").trim().notEmpty().withMessage("Task title is required"),
  body("description").optional().trim(),
  body("deadline").isISO8601().withMessage("Valid deadline is required"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Invalid priority"),
  body("assignedTo")
    .optional()
    .isInt()
    .withMessage("Assigned user ID must be an integer"),
  body("visibility")
    .optional()
    .isIn(["private", "public", "team", "core"])
    .withMessage("Invalid visibility"),
  body("dependsOn")
    .optional()
    .isInt()
    .withMessage("Dependency task ID must be an integer"),
  handleValidationErrors,
];

// Comment validation rules
const validateComment = [
  body("commentText").trim().notEmpty().withMessage("Comment text is required"),
  body("parentId")
    .optional()
    .isInt()
    .withMessage("Parent comment ID must be an integer"),
  handleValidationErrors,
];

// ID parameter validation
const validateId = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID"),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateTeam,
  validateTask,
  validateComment,
  validateId,
};
