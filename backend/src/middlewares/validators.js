const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validación de evaluaciones
exports.validateEvaluation = [
  // Validación del empleado
  body('employee')
    .notEmpty()
    .withMessage('El empleado es requerido')
    .isMongoId()
    .withMessage('ID de empleado inválido'),

  // Validación del tipo de evaluación
  body('evaluationType')
    .notEmpty()
    .withMessage('El tipo de evaluación es requerido')
    .isIn(['360', 'self', 'peer', 'manager'])
    .withMessage('Tipo de evaluación inválido'),

  // Validación del periodo
  body('period.startDate')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido'),

  body('period.endDate')
    .notEmpty()
    .withMessage('La fecha de fin es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.period.startDate)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),

  // Validación de categorías
  body('categories')
    .isArray()
    .withMessage('Las categorías deben ser un array')
    .notEmpty()
    .withMessage('Debe incluir al menos una categoría'),

  body('categories.*.name')
    .notEmpty()
    .withMessage('El nombre de la categoría es requerido')
    .isString()
    .withMessage('El nombre debe ser un texto'),

  body('categories.*.weight')
    .notEmpty()
    .withMessage('El peso de la categoría es requerido')
    .isFloat({ min: 0, max: 100 })
    .withMessage('El peso debe ser un número entre 0 y 100'),

  body('categories.*.criteria')
    .isArray()
    .withMessage('Los criterios deben ser un array')
    .notEmpty()
    .withMessage('Debe incluir al menos un criterio'),

  body('categories.*.criteria.*.description')
    .notEmpty()
    .withMessage('La descripción del criterio es requerida')
    .isString()
    .withMessage('La descripción debe ser un texto'),

  body('categories.*.criteria.*.weight')
    .notEmpty()
    .withMessage('El peso del criterio es requerido')
    .isFloat({ min: 0, max: 100 })
    .withMessage('El peso debe ser un número entre 0 y 100'),

  // Validación de evaluadores
  body('evaluators')
    .isArray()
    .withMessage('Los evaluadores deben ser un array')
    .notEmpty()
    .withMessage('Debe incluir al menos un evaluador'),

  body('evaluators.*.user')
    .notEmpty()
    .withMessage('El usuario evaluador es requerido')
    .isMongoId()
    .withMessage('ID de usuario inválido'),

  body('evaluators.*.relationship')
    .notEmpty()
    .withMessage('La relación del evaluador es requerida')
    .isIn(['self', 'peer', 'manager', 'subordinate'])
    .withMessage('Relación inválida'),

  // Validación personalizada para verificar que la suma de los pesos sea 100
  body('categories').custom((categories) => {
    const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
    if (totalWeight !== 100) {
      throw new Error('La suma de los pesos de las categorías debe ser 100');
    }

    // Verificar que la suma de los pesos de los criterios en cada categoría sea 100
    categories.forEach((category, index) => {
      const totalCriteriaWeight = category.criteria.reduce(
        (sum, criterion) => sum + criterion.weight,
        0
      );
      if (totalCriteriaWeight !== 100) {
        throw new Error(
          `La suma de los pesos de los criterios en la categoría ${index + 1} debe ser 100`
        );
      }
    });

    return true;
  }),

  // Middleware para manejar los errores de validación
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return next(new AppError(errorMessages.join('. '), 400));
    }
    next();
  },
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