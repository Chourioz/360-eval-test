const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');
const mongoose = require('mongoose');
const { validate: validateRequest } = require('./validate');

// Validación completa para creación de evaluación
const validateEvaluation = [
  body('employee').notEmpty().withMessage('El empleado es requerido'),
  body('evaluationType').isIn(['self', '360', 'peer']).withMessage('Tipo de evaluación inválido'),
  body('period').isObject().withMessage('El período es requerido'),
  body('period.startDate').isISO8601().withMessage('Fecha de inicio inválida'),
  body('period.endDate').isISO8601().withMessage('Fecha de fin inválida'),
  body('categories').isArray({ min: 1 }).withMessage('Se requiere al menos una categoría'),
  body('categories.*.name').notEmpty().withMessage('El nombre de la categoría es requerido'),
  body('categories.*.weight').isInt({ min: 1, max: 100 }).withMessage('El peso debe estar entre 1 y 100'),
  body('categories.*.criteria').isArray({ min: 1 }).withMessage('Se requiere al menos un criterio'),
  body('evaluators').isArray({ min: 1 }).withMessage('Se requiere al menos un evaluador'),
  // Validar que la suma de los pesos sea 100
  (req, res, next) => {
    const { categories } = req.body;
    if (categories) {
      const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
      if (totalWeight !== 100) {
        return next(new AppError('La suma de los pesos de las categorías debe ser 100', 400));
      }
    }
    next();
  },
  // Validar resultados
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Error de validación', 400, errors.array()));
    }
    next();
  }
];

// Validación parcial para actualización de evaluación
const validateEvaluationUpdate = [
  body('evaluationType')
    .optional()
    .isIn(['self', '360', 'peer'])
    .withMessage('Tipo de evaluación inválido'),
  body('period')
    .optional()
    .isObject()
    .withMessage('El período debe ser un objeto válido'),
  body('period.startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('period.endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  // Solo validar los pesos de las categorías si se están actualizando todas
  (req, res, next) => {
    const { categories } = req.body;
    if (categories && categories.length > 0) {
      const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
      if (totalWeight !== 100) {
        return next(new AppError('La suma de los pesos de las categorías debe ser 100', 400));
      }
    }
    next();
  },
  // Validar resultados
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Error de validación', 400, errors.array()));
    }
    next();
  }
];

// Validación de feedback
const validateFeedback = [
  body('feedback')
    .isArray()
    .withMessage('El feedback debe ser un array')
    .notEmpty()
    .withMessage('Debe incluir al menos un feedback'),

  body('feedback.*.categoryId')
    .notEmpty()
    .withMessage('El ID de la categoría es requerido')
    .isMongoId()
    .withMessage('ID de categoría inválido'),

  body('feedback.*.criteriaId')
    .notEmpty()
    .withMessage('El ID del criterio es requerido')
    .isMongoId()
    .withMessage('ID de criterio inválido'),

  body('feedback.*.score')
    .notEmpty()
    .withMessage('La puntuación es requerida')
    .isFloat({ min: 1, max: 5 })
    .withMessage('La puntuación debe ser un número entre 1 y 5'),

  body('feedback.*.comment')
    .optional()
    .isString()
    .withMessage('El comentario debe ser un texto')
    .isLength({ min: 10, max: 500 })
    .withMessage('El comentario debe tener entre 10 y 500 caracteres'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return next(new AppError(errorMessages.join('. '), 400));
    }
    next();
  },
];

// Employee validation
const validateEmployee = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('position')
    .notEmpty()
    .withMessage('Position is required'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status')
];

const validateEmployeeUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  body('position')
    .optional()
    .notEmpty()
    .withMessage('Position cannot be empty'),
  body('department')
    .optional()
    .notEmpty()
    .withMessage('Department cannot be empty'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Invalid status'),
  body('managerId')
    .optional()
    .custom(value => {
      if (value === 'remove') return true;
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage('Invalid manager ID format')
];

// Validate forgot password request
const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  validateRequest
];

// Validate reset password request
const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.].*$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&)')
];

// Validate verify reset token request
const validateVerifyResetToken = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),
  validateRequest
];

// Auth validation middleware
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
];

const validateRegister = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Invalid role')
];

// Export all validators
module.exports = {
  validateLogin,
  validateRegister,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyResetToken,
  validateEvaluation,
  validateEvaluationUpdate,
  validateFeedback,
  validateEmployee,
  validateEmployeeUpdate
}; 