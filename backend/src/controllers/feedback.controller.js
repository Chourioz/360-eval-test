const { AppError } = require('../middlewares/errorHandler');
const Evaluation = require('../models/Evaluation');
const logger = require('../utils/logger');

// Obtener feedback pendiente para un usuario
exports.getPendingFeedback = async (req, res, next) => {
  try {
    const evaluations = await Evaluation.find({
      'evaluators.user': req.user.id,
      'evaluators.status': { $ne: 'completed' },
      status: 'in_progress'
    })
    .populate('employee', 'firstName lastName position department')
    .populate('metadata.createdBy', 'firstName lastName')
    .select('evaluationType period categories evaluators');

    const pendingFeedback = evaluations.map(evaluation => {
      const evaluator = evaluation.evaluators.find(
        e => e.user.toString() === req.user.id
      );

      return {
        evaluationId: evaluation._id,
        evaluationType: evaluation.evaluationType,
        employee: evaluation.employee,
        dueDate: evaluation.period.endDate,
        status: evaluator.status,
        progress: evaluator.feedback ? 
          (evaluator.feedback.length / evaluation.getTotalCriteria()) * 100 : 0
      };
    });

    res.status(200).json({
      status: 'success',
      results: pendingFeedback.length,
      data: {
        pendingFeedback
      }
    });
  } catch (error) {
    logger.error('Error al obtener feedback pendiente:', error);
    next(error);
  }
};

// Obtener detalles de una evaluación para dar feedback
exports.getFeedbackDetails = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate('employee', 'firstName lastName position department')
      .populate('metadata.createdBy', 'firstName lastName');

    if (!evaluation) {
      return next(new AppError('No se encontró la evaluación', 404));
    }

    const evaluator = evaluation.evaluators.find(
      e => e.user.toString() === req.user.id
    );

    if (!evaluator) {
      return next(new AppError('No está autorizado para dar feedback en esta evaluación', 403));
    }

    if (evaluator.status === 'completed') {
      return next(new AppError('Ya ha completado su feedback para esta evaluación', 400));
    }

    res.status(200).json({
      status: 'success',
      data: {
        evaluation: {
          id: evaluation._id,
          evaluationType: evaluation.evaluationType,
          employee: evaluation.employee,
          period: evaluation.period,
          categories: evaluation.categories,
          currentFeedback: evaluator.feedback || []
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener detalles de feedback:', error);
    next(error);
  }
};

// Enviar feedback para una evaluación
exports.submitFeedback = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return next(new AppError('No se encontró la evaluación', 404));
    }

    const evaluatorIndex = evaluation.evaluators.findIndex(
      e => e.user.toString() === req.user.id
    );

    if (evaluatorIndex === -1) {
      return next(new AppError('No está autorizado para dar feedback en esta evaluación', 403));
    }

    if (evaluation.evaluators[evaluatorIndex].status === 'completed') {
      return next(new AppError('Ya ha completado su feedback para esta evaluación', 400));
    }

    // Validar que el feedback corresponde a las categorías y criterios de la evaluación
    const { feedback } = req.body;
    for (const item of feedback) {
      const category = evaluation.categories.find(
        c => c._id.toString() === item.categoryId
      );
      if (!category) {
        return next(new AppError(`Categoría ${item.categoryId} no encontrada`, 400));
      }

      const criteria = category.criteria.find(
        c => c._id.toString() === item.criteriaId
      );
      if (!criteria) {
        return next(new AppError(`Criterio ${item.criteriaId} no encontrado`, 400));
      }
    }

    // Actualizar el feedback del evaluador
    evaluation.evaluators[evaluatorIndex].feedback = feedback;
    evaluation.evaluators[evaluatorIndex].status = 'completed';
    evaluation.evaluators[evaluatorIndex].submittedAt = new Date();

    await evaluation.save();

    // Verificar si todos los evaluadores han completado su feedback
    const allCompleted = evaluation.evaluators.every(e => e.status === 'completed');
    if (allCompleted) {
      evaluation.status = 'completed';
      await evaluation.save();
      // TODO: Enviar notificación de evaluación completada
    }

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Feedback enviado exitosamente'
      }
    });
  } catch (error) {
    logger.error('Error al enviar feedback:', error);
    next(error);
  }
};

// Obtener resumen de feedback recibido
exports.getFeedbackSummary = async (req, res, next) => {
  try {
    const evaluations = await Evaluation.find({
      employee: req.user.id,
      status: 'completed'
    })
    .populate('evaluators.user', 'firstName lastName position')
    .sort('-period.endDate');

    const summary = evaluations.map(evaluation => {
      const averageScores = {};
      let totalComments = 0;

      evaluation.categories.forEach(category => {
        let categoryTotal = 0;
        let categoryCount = 0;

        evaluation.evaluators.forEach(evaluator => {
          evaluator.feedback.forEach(feedback => {
            if (feedback.categoryId.toString() === category._id.toString()) {
              categoryTotal += feedback.score;
              categoryCount++;
              if (feedback.comment) totalComments++;
            }
          });
        });

        averageScores[category.name] = categoryCount > 0 ? 
          Number((categoryTotal / categoryCount).toFixed(2)) : 0;
      });

      return {
        id: evaluation._id,
        period: evaluation.period,
        evaluationType: evaluation.evaluationType,
        averageScores,
        totalEvaluators: evaluation.evaluators.length,
        totalComments,
        overallScore: evaluation.averageScore
      };
    });

    res.status(200).json({
      status: 'success',
      results: summary.length,
      data: {
        summary
      }
    });
  } catch (error) {
    logger.error('Error al obtener resumen de feedback:', error);
    next(error);
  }
}; 