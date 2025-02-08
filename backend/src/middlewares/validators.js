const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validación completa para creación de evaluación
exports.validateEvaluation = [
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
exports.validateEvaluationUpdate = [
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
exports.validateFeedback = [
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