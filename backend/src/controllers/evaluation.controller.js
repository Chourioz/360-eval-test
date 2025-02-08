const { AppError } = require('../middlewares/errorHandler');
const Evaluation = require('../models/Evaluation');
const Employee = require('../models/Employee');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

// Crear una nueva evaluación
exports.createEvaluation = async (req, res, next) => {
  try {
    const {
      employee,
      evaluationType,
      period,
      categories,
      evaluators
    } = req.body;

    // Verificar que el empleado existe
    const employeeExists = await Employee.findById(employee);
    if (!employeeExists) {
      return next(new AppError('El empleado especificado no existe', 404));
    }

    // Verificar que los evaluadores existen
    for (const evaluator of evaluators) {
      const evaluatorExists = await Employee.findOne({ user: evaluator.user });
      if (!evaluatorExists) {
        return next(new AppError(`El evaluador ${evaluator.user} no existe`, 404));
      }
    }

    const evaluation = await Evaluation.create({
      employee,
      evaluationType,
      period,
      categories,
      evaluators,
      metadata: {
        createdBy: req.user.id,
        lastModifiedBy: req.user.id
      }
    });

    // Invalidar caché de listas
    await cacheService.delete(cacheService.generateListKey('evaluations'));
    logger.debug('Evaluations list cache invalidated');

    res.status(201).json({
      status: 'success',
      data: {
        evaluation
      }
    });
  } catch (error) {
    logger.error('Error al crear evaluación:', error);
    next(error);
  }
};

// Obtener todas las evaluaciones
exports.getAllEvaluations = async (req, res, next) => {
  try {
    const { status, type, employee } = req.query;
    const cacheKey = cacheService.generateListKey('evaluations', JSON.stringify(req.query));
    
    // Intentar obtener de caché
    const cachedEvaluations = await cacheService.get(cacheKey);
    if (cachedEvaluations) {
      logger.debug('Cache hit for evaluations list');
      return res.json({
        status: 'success',
        data: cachedEvaluations
      });
    }

    // Construir query
    const query = {};
    if (status) query.status = status;
    if (type) query.evaluationType = type;
    if (employee) query.employee = employee;

    const evaluations = await Evaluation.find(query)
      .populate('employee', 'firstName lastName position department')
      .populate('evaluators.user', 'firstName lastName email')
      .populate('metadata.createdBy', 'firstName lastName')
      .sort('-createdAt');

    // Guardar en caché
    await cacheService.set(cacheKey, evaluations, 1800); // TTL de 30 minutos
    logger.debug('Cache set for evaluations list');

    res.status(200).json({
      status: 'success',
      results: evaluations.length,
      data: {
        evaluations
      }
    });
  } catch (error) {
    logger.error('Error al obtener evaluaciones:', error);
    next(error);
  }
};

// Obtener una evaluación específica
exports.getEvaluation = async (req, res, next) => {
  try {
    const cacheKey = cacheService.generateKey('evaluation', req.params.id);
    
    // Intentar obtener de caché
    const cachedEvaluation = await cacheService.get(cacheKey);
    if (cachedEvaluation) {
      logger.debug(`Cache hit for evaluation ${req.params.id}`);
      return res.json({
        status: 'success',
        data: cachedEvaluation
      });
    }

    // Si no está en caché, obtener de la base de datos
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('employee', 'firstName lastName position department')
      .populate('evaluators.user', 'firstName lastName email')
      .populate('metadata.createdBy', 'firstName lastName');

    if (!evaluation) {
      return next(new AppError('No se encontró la evaluación', 404));
    }

    // Verificar permisos de acceso
    const hasAccess = 
      req.user.role === 'admin' ||
      evaluation.employee.toString() === req.user.id ||
      evaluation.evaluators.some(e => e.user.toString() === req.user.id) ||
      evaluation.metadata.createdBy.toString() === req.user.id;

    if (!hasAccess) {
      return next(new AppError('No tiene permiso para ver esta evaluación', 403));
    }

    // Guardar en caché
    await cacheService.set(cacheKey, evaluation);
    logger.debug(`Cache set for evaluation ${req.params.id}`);

    res.status(200).json({
      status: 'success',
      data: {
        evaluation
      }
    });
  } catch (error) {
    logger.error('Error al obtener evaluación:', error);
    next(error);
  }
};

// Actualizar una evaluación
exports.updateEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return next(new AppError('No se encontró la evaluación', 404));
    }

    // Solo permitir actualización si está en estado draft o si es admin
    if (evaluation.status !== 'draft' && req.user.role !== 'admin') {
      return next(new AppError('No se puede modificar una evaluación en progreso', 400));
    }

    // Actualizar los campos permitidos
    const updatedEvaluation = await Evaluation.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        'metadata.lastModifiedBy': req.user.id
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Invalidar cachés
    const cacheKey = cacheService.generateKey('evaluation', req.params.id);
    await Promise.all([
      cacheService.delete(cacheKey),
      cacheService.delete(cacheService.generateListKey('evaluations'))
    ]);
    logger.debug(`Cache invalidated for evaluation ${req.params.id}`);

    res.status(200).json({
      status: 'success',
      data: {
        evaluation: updatedEvaluation
      }
    });
  } catch (error) {
    logger.error('Error al actualizar evaluación:', error);
    next(error);
  }
};

// Eliminar una evaluación
exports.deleteEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return next(new AppError('No se encontró la evaluación', 404));
    }

    // Solo permitir eliminación si está en estado draft o si es admin
    if (evaluation.status !== 'draft' && req.user.role !== 'admin') {
      return next(new AppError('No se puede eliminar una evaluación en progreso', 400));
    }

    await evaluation.deleteOne();

    // Invalidar cachés
    const cacheKey = cacheService.generateKey('evaluation', req.params.id);
    await Promise.all([
      cacheService.delete(cacheKey),
      cacheService.delete(cacheService.generateListKey('evaluations'))
    ]);
    logger.debug(`Cache invalidated for evaluation ${req.params.id}`);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Error al eliminar evaluación:', error);
    next(error);
  }
};

// Iniciar una evaluación
exports.startEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return next(new AppError('No se encontró la evaluación', 404));
    }

    if (evaluation.status !== 'draft') {
      return next(new AppError('La evaluación ya ha sido iniciada', 400));
    }

    evaluation.status = 'in_progress';
    evaluation.metadata.lastModifiedBy = req.user.id;
    await evaluation.save();

    // TODO: Enviar notificaciones a los evaluadores

    res.status(200).json({
      status: 'success',
      data: {
        evaluation
      }
    });
  } catch (error) {
    logger.error('Error al iniciar evaluación:', error);
    next(error);
  }
};

// Finalizar una evaluación
exports.completeEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return next(new AppError('No se encontró la evaluación', 404));
    }

    if (evaluation.status !== 'in_progress') {
      return next(new AppError('La evaluación no está en progreso', 400));
    }

    // Verificar que todos los evaluadores han completado su feedback
    const allCompleted = evaluation.evaluators.every(e => e.status === 'completed');
    if (!allCompleted) {
      return next(new AppError('No todos los evaluadores han completado su feedback', 400));
    }

    evaluation.status = 'completed';
    evaluation.metadata.lastModifiedBy = req.user.id;
    await evaluation.save();

    // TODO: Enviar notificaciones de finalización

    res.status(200).json({
      status: 'success',
      data: {
        evaluation
      }
    });
  } catch (error) {
    logger.error('Error al completar evaluación:', error);
    next(error);
  }
}; 