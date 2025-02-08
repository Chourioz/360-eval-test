const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

// Validaciones
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Invalid role'),
  body('position')
    .if(body('role').equals('employee'))
    .notEmpty()
    .withMessage('Position is required for employees'),
  body('department')
    .if(body('role').equals('employee'))
    .notEmpty()
    .withMessage('Department is required for employees')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Please provide a password')
];

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .not()
    .equals(body('currentPassword'))
    .withMessage('New password must be different from current password')
];

// Rutas
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);

// Rutas protegidas
router.use(verifyToken); // Aplicar middleware de autenticación a todas las rutas siguientes

router.get('/me', authController.getMe);
router.patch(
  '/update-password',
  updatePasswordValidation,
  validate,
  authController.updatePassword
);

module.exports = router; 