const express = require("express");
const { body } = require("express-validator");
const {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  getMe,
  updatePassword,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const {
  validateLogin,
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyResetToken,
} = require("../middlewares/validators");

const router = express.Router();

// Validaciones
const registerValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("role")
    .optional()
    .isIn(["admin", "manager", "employee"])
    .withMessage("Invalid role"),
  body("position")
    .if(body("role").equals("employee"))
    .notEmpty()
    .withMessage("Position is required for employees"),
  body("department")
    .if(body("role").equals("employee"))
    .notEmpty()
    .withMessage("Department is required for employees"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Please provide a password"),
];

const updatePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .not()
    .equals(body("currentPassword"))
    .withMessage("New password must be different from current password"),
];

// Rutas públicas
router.post("/register", validateRegister, validate, register);
router.post("/login", validateLogin, validate, login);
router.post("/forgot-password", validateForgotPassword, validate, forgotPassword);
router.post("/reset-password", validateResetPassword, validate, resetPassword);
router.post("/verify-reset-token", validateVerifyResetToken, validate, verifyResetToken);

// Rutas protegidas
router.use(verifyToken); // Aplicar middleware de autenticación a todas las rutas siguientes

router.get("/me", getMe);
router.patch(
  "/update-password",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .not()
      .equals(body("currentPassword"))
      .withMessage("New password must be different from current password"),
    validate
  ],
  updatePassword
);

module.exports = router;
