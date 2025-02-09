const { AppError } = require("../middlewares/errorHandler");
const Evaluation = require("../models/Evaluation");
const Employee = require("../models/Employee");
const cacheService = require("../services/cacheService");
const logger = require("../utils/logger");
const Feedback = require("../models/Feedback");

// Crear una nueva evaluación
exports.createEvaluation = async (req, res, next) => {
  try {
    const { employee, evaluationType, evaluators, ...evaluationData } =
      req.body;

    // Verificar si el empleado existe
    const employeeDoc = await Employee.findById(employee).populate("user");
    if (!employeeDoc) {
      return next(new AppError("Empleado no encontrado", 404));
    }

    // Preparar los evaluadores
    let finalEvaluators = [...(evaluators || [])];

    // Si es autoevaluación, agregar al empleado como evaluador automáticamente
    if (evaluationType === "self" || evaluationType === "360") {
      const selfEvaluator = {
        user: employeeDoc.user._id,
        relationship: "self",
        status: "pending",
      };

      // Verificar si ya existe para no duplicar
      const exists = finalEvaluators.some(
        (e) =>
          e.user.toString() === selfEvaluator.user.toString() &&
          e.relationship === "self"
      );

      if (!exists) {
        finalEvaluators.push(selfEvaluator);
      }
    }

    const evaluation = await Evaluation.create({
      ...evaluationData,
      employee,
      evaluationType,
      evaluators: finalEvaluators,
      metadata: {
        createdBy: req.user.id,
        lastModifiedBy: req.user.id,
      },
    });

    // Invalidar caché
    await cacheService.delete(cacheService.generateListKey("evaluations"));

    res.status(201).json({
      status: "success",
      data: evaluation,
    });
  } catch (error) {
    logger.error("Error al crear evaluación:", error);
    next(error);
  }
};

// Role-based query builder
const getRoleBasedQuery = async (user) => {
  let baseQuery = Evaluation.find()
    .populate({
      path: "employee",
      select: "position department user",
      populate: {
        path: "user",
        select: "firstName lastName",
      },
    })
    .populate("evaluators.user", "firstName lastName email")
    .populate("metadata.createdBy", "firstName lastName");

  if (user.role === "admin") return baseQuery;

  // Debug: Log user ID and role
  console.log(`Building query for ${user.role} with ID: ${user._id}`);

  const userConditions = [
    { employee: user._id },
    { "evaluators.user": user._id },
  ];

  if (user.role === "manager") {
    // First find the manager's employee record
    const managerEmployee = await Employee.findOne({ user: user._id });
    if (managerEmployee) {
      const managedEmployees = await Employee.find({
        manager: managerEmployee._id,
      }).select("_id");
      userConditions.push({
        employee: { $in: managedEmployees.map((e) => e._id) },
      });
    }
  }

  // Debug: Log final conditions
  console.log(
    "Final query conditions:",
    JSON.stringify(userConditions, null, 2)
  );

  // Convert to Mongoose query properly
  return baseQuery.find({ $or: userConditions });
};

// Obtener todas las evaluaciones
exports.getAllEvaluations = async (req, res, next) => {
  try {
    const user = req.user;
    const cacheKey = cacheService.generateListKey(`evaluations:${user._id}`);

    // Debug: Log user info
    console.log("Fetching evaluations for user:", {
      userId: user._id,
      role: user.role,
    });

    let baseQuery = Evaluation.find()
      .populate({
        path: "employee",
        select: "position department user",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      })
      .populate("evaluators.user", "firstName lastName email")
      .populate("metadata.createdBy", "firstName lastName");

    let queryConditions = [];

    // Role-based query conditions
    switch (user.role) {
      case "admin":
        // Admins can see all evaluations
        break;

      case "manager":
        // Get manager's employee record
        const managerEmployee = await Employee.findOne({ user: user._id });

        if (managerEmployee) {
          // Get all subordinates
          const managedEmployees = await Employee.find({
            manager: managerEmployee._id,
          }).select("_id");

          queryConditions = [
            // Evaluations where manager is the employee
            { employee: managerEmployee._id },
            // Evaluations where manager is an evaluator
            { "evaluators.user": user._id },
            // Evaluations of subordinates
            { employee: { $in: managedEmployees.map((e) => e._id) } },
          ];
        } else {
          // If no employee record found, only show personal evaluations
          queryConditions = [{ "evaluators.user": user._id }];
        }
        break;

      case "employee":
      default:
        // Get employee record
        const employeeRecord = await Employee.findOne({ user: user._id });

        if (!employeeRecord) {
          logger.warn(`No employee record found for user ${user._id}`);
          // Even if no employee record, still check for evaluator role
          queryConditions = [{ "evaluators.user": user._id }];
        } else {
          queryConditions = [
            // Evaluations where user is the employee being evaluated
            { employee: employeeRecord._id },
            // Evaluations where user is an evaluator
            { "evaluators.user": user._id },
          ];
        }

        // Debug employee query
        console.log("Employee query conditions:", {
          employeeId: employeeRecord?._id,
          userId: user._id,
          conditions: queryConditions,
        });
        break;
    }

    // Apply query conditions if any
    const query =
      queryConditions.length > 0
        ? baseQuery.find({ $or: queryConditions })
        : baseQuery;

    // Debug: Log final query
    console.log("Final query:", {
      conditions: queryConditions,
      filter: query.getFilter(),
      populates: query.getPopulatedPaths(),
    });

    const evaluations = await query.lean().exec();

    // Debug query results
    console.log("Query results:", {
      total: evaluations.length,
      evaluationIds: evaluations.map((e) => e._id),
      conditions: queryConditions,
      userRole: user.role,
      userId: user._id,
    });

    // Transform results to include computed fields
    const transformed = evaluations.map((evaluation) => ({
      ...evaluation,
      employee: {
        ...evaluation.employee,
        fullName: evaluation.employee?.user
          ? `${evaluation.employee.user.firstName} ${evaluation.employee.user.lastName}`
          : "Nombre no disponible",
      },
      progress: calculateProgress(evaluation),
      averageScore: calculateAverageScore(evaluation),
    }));

    // Cache results
    if (cacheService.isConnected) {
      await cacheService.set(cacheKey, {
        status: "success",
        results: transformed.length,
        data: transformed,
      });
    }

    res.status(200).json({
      status: "success",
      results: transformed.length,
      data: transformed,
    });
  } catch (error) {
    logger.error("Error fetching evaluations:", {
      error: error.message,
      stack: error.stack,
    });
    next(new AppError("Error retrieving evaluations", 500));
  }
};

// Helper function to calculate progress
const calculateProgress = (evaluation) => {
  if (!evaluation.evaluators || evaluation.evaluators.length === 0) return 0;
  const completedEvaluators = evaluation.evaluators.filter(
    (e) => e.status === "completed"
  ).length;
  return Math.round((completedEvaluators / evaluation.evaluators.length) * 100);
};

// Helper function to calculate average score
const calculateAverageScore = (evaluation) => {
  if (!evaluation.evaluators || evaluation.evaluators.length === 0) return 0;

  const completedEvaluators = evaluation.evaluators.filter(
    (e) => e.status === "completed"
  );
  if (completedEvaluators.length === 0) return 0;

  // Implementation depends on your scoring logic
  // This is a placeholder that should be adjusted based on your needs
  return 0;
};

// Obtener una evaluación específica
exports.getEvaluation = async (req, res, next) => {
  try {
    let evaluation = await Evaluation.findById(req.params.id)
      .populate({
        path: "employee",
        populate: {
          path: "user",
          select: "firstName lastName email",
        },
      })
      .populate("evaluators.user", "firstName lastName email")
      .populate("metadata.createdBy", "firstName lastName email");

    if (!evaluation) {
      return next(new AppError("No se encontró la evaluación", 404));
    }

    // Obtener el feedback asociado a esta evaluación
    const feedbacks = await Feedback.find({
      evaluation: evaluation._id,
    }).populate("evaluator", "firstName lastName email");
    // Agregar el feedback a cada evaluador
    const evaluatorsWithFeedback = evaluation.evaluators.map((evaluator) => {
      const evaluatorFeedback = feedbacks.find(
        (f) => f.evaluator.id === evaluator.user.id
      );
      if (evaluatorFeedback) {
        return {
          ...evaluator.toJSON(),
          feedback: evaluatorFeedback.responses.map((response) => ({
            categoryId: response.categoryId,
            criteriaId: response.criteriaId,
            rating: response.rating,
            comment: response.comment,
          })),
        };
      }
      return evaluator;
    });
    console.log("EVALUATORS WITH FEEDBACK ===> ", evaluatorsWithFeedback);
    
    res.status(200).json({
      status: "success",
      data: {
        ...evaluation.toJSON(),
        evaluators: evaluatorsWithFeedback,
      },
    });
  } catch (error) {
    logger.error("Error al obtener evaluación:", error);
    next(error);
  }
};

// Actualizar una evaluación
exports.updateEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return next(new AppError("Evaluación no encontrada", 404));
    }

    if (evaluation.status !== "draft") {
      return next(
        new AppError("No se puede modificar una evaluación en progreso", 400)
      );
    }

    // Filtrar solo los campos que vienen en el body
    const updateData = Object.keys(req.body).reduce((acc, key) => {
      // Solo incluir campos que no sean undefined, null, o arrays vacíos
      if (
        req.body[key] !== undefined &&
        req.body[key] !== null &&
        !(Array.isArray(req.body[key]) && req.body[key].length === 0)
      ) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});

    // Si se está actualizando el tipo de evaluación o los evaluadores
    if (updateData.evaluationType || updateData.evaluators) {
      const evaluationType =
        updateData.evaluationType || evaluation.evaluationType;
      let evaluators = updateData.evaluators || evaluation.evaluators;

      // Si es autoevaluación o 360, asegurar que el empleado esté como evaluador
      if (evaluationType === "self" || evaluationType === "360") {
        const employeeDoc = await Employee.findById(
          evaluation.employee
        ).populate("user");
        const selfEvaluator = {
          user: employeeDoc.user._id,
          relationship: "self",
          status: "pending",
        };

        // Verificar si ya existe para no duplicar
        const exists = evaluators.some(
          (e) =>
            e.user.toString() === selfEvaluator.user.toString() &&
            e.relationship === "self"
        );

        if (!exists) {
          evaluators = [...evaluators, selfEvaluator];
          updateData.evaluators = evaluators;
        }
      }
    }

    // Agregar el campo de metadata si hay cambios
    if (Object.keys(updateData).length > 0) {
      updateData["metadata.lastModifiedBy"] = req.user.id;
    }

    // Actualizar solo los campos proporcionados
    const updatedEvaluation = await Evaluation.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
        context: "query",
        validateModifiedOnly: true,
      }
    );

    // Invalidar cachés
    const cacheKey = cacheService.generateKey("evaluation", req.params.id);
    await Promise.all([
      cacheService.delete(cacheKey),
      cacheService.delete(cacheService.generateListKey("evaluations")),
    ]);

    res.status(200).json({
      status: "success",
      data: updatedEvaluation,
    });
  } catch (error) {
    logger.error("Error al actualizar evaluación:", error);
    next(error);
  }
};

// Eliminar una evaluación
exports.deleteEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return next(new AppError("No se encontró la evaluación", 404));
    }

    // Solo permitir eliminación si está en estado draft o si es admin
    if (evaluation.status !== "draft" && req.user.role !== "admin") {
      return next(
        new AppError("No se puede eliminar una evaluación en progreso", 400)
      );
    }

    await evaluation.deleteOne();

    // Invalidar cachés
    const cacheKey = cacheService.generateKey("evaluation", req.params.id);
    await Promise.all([
      cacheService.delete(cacheKey),
      cacheService.delete(cacheService.generateListKey("evaluations")),
    ]);
    logger.debug(`Cache invalidated for evaluation ${req.params.id}`);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    logger.error("Error al eliminar evaluación:", error);
    next(error);
  }
};

// Iniciar una evaluación
exports.startEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id).populate({
      path: "employee",
      populate: {
        path: "user",
        select: "firstName lastName email",
      },
    });

    if (!evaluation) {
      return next(new AppError("No se encontró la evaluación", 404));
    }

    // Verificar permisos
    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";
    const isEmployee =
      evaluation.employee.user._id.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isEmployee) {
      return next(
        new AppError("No tiene permiso para iniciar esta evaluación", 403)
      );
    }

    if (evaluation.status !== "draft") {
      return next(new AppError("La evaluación ya ha sido iniciada", 400));
    }

    evaluation.status = "in_progress";
    evaluation.metadata.lastModifiedBy = req.user.id;
    await evaluation.save();

    // Invalidar cachés
    const cacheKey = cacheService.generateKey("evaluation", req.params.id);
    await Promise.all([
      cacheService.delete(cacheKey),
      cacheService.delete(cacheService.generateListKey("evaluations")),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        evaluation,
      },
    });
  } catch (error) {
    logger.error("Error al iniciar evaluación:", error);
    next(error);
  }
};

// Completar una evaluación
exports.completeEvaluation = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('evaluators.user', 'firstName lastName email');

    if (!evaluation) {
      return next(new AppError('No se encontró la evaluación', 404));
    }

    if (evaluation.status !== 'in_progress') {
      return next(new AppError('La evaluación no está en progreso', 400));
    }

    // Verificar que todos los evaluadores hayan completado su feedback
    const pendingEvaluators = evaluation.evaluators.filter(
      (e) => e.status !== 'completed'
    );
    if (pendingEvaluators.length > 0) {
      return next(
        new AppError('Hay evaluadores pendientes de completar su feedback', 400)
      );
    }

    // Verificar permisos
    const isAdmin = req.user.role === 'admin';
    const isManager = req.user.role === 'manager';
    const isEmployee = evaluation.employee.user._id.toString() === req.user._id.toString();
    const isSelfEvaluation = evaluation.evaluationType === 'self';

    // Permitir completar si:
    // 1. Es admin o manager
    // 2. Es una autoevaluación y el usuario es el empleado siendo evaluado
    if (!isAdmin && !isManager && !(isSelfEvaluation && isEmployee)) {
      return next(
        new AppError('No tiene permiso para completar esta evaluación', 403)
      );
    }

    evaluation.status = 'completed';
    evaluation.metadata.lastModifiedBy = req.user._id;
    await evaluation.save();

    // Invalidar cachés
    const cacheKey = cacheService.generateKey('evaluation', req.params.id);
    await Promise.all([
      cacheService.delete(cacheKey),
      cacheService.delete(cacheService.generateListKey('evaluations')),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        evaluation,
      },
    });
  } catch (error) {
    logger.error('Error al completar evaluación:', error);
    next(error);
  }
};

// Submit feedback for an evaluation
exports.submitFeedback = async (req, res, next) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate("evaluators.user", "firstName lastName email")
      .populate("employee");

    if (!evaluation) {
      return next(new AppError("No se encontró la evaluación", 404));
    }

    // Verificar si el usuario es un evaluador válido
    const evaluator = evaluation.evaluators.find(
      (e) => e.user._id.toString() === req.user.id
    );

    if (!evaluator) {
      return next(
        new AppError("No estás autorizado para evaluar esta evaluación", 403)
      );
    }

    // Verificar si la evaluación está en progreso
    if (evaluation.status !== "in_progress") {
      return next(new AppError("La evaluación no está en progreso", 400));
    }

    // Verificar si el evaluador ya completó su feedback
    if (evaluator.status === "completed") {
      return next(
        new AppError("Ya has completado tu feedback para esta evaluación", 400)
      );
    }

    // Validar las respuestas
    const { responses } = req.body;
    if (!responses || !Array.isArray(responses)) {
      return next(new AppError("Las respuestas son requeridas", 400));
    }

    // Verificar que todas las categorías y criterios existen
    for (const response of responses) {
      const category = evaluation.categories.find(
        (c) => c._id.toString() === response.categoryId
      );
      if (!category) {
        return next(
          new AppError(`Categoría no encontrada: ${response.categoryId}`, 400)
        );
      }

      const criterion = category.criteria.find(
        (c) => c._id.toString() === response.criteriaId
      );
      if (!criterion) {
        return next(
          new AppError(`Criterio no encontrado: ${response.criteriaId}`, 400)
        );
      }

      if (response.rating < 1 || response.rating > 5) {
        return next(
          new AppError("La calificación debe estar entre 1 y 5", 400)
        );
      }
    }

    // Crear el registro de feedback
    const feedback = await Feedback.create({
      evaluation: evaluation._id,
      evaluator: req.user.id,
      employee: evaluation.employee._id,
      responses: responses.map((response) => ({
        categoryId: response.categoryId,
        criteriaId: response.criteriaId,
        rating: response.rating,
        comment: response.comment || "",
      })),
      status: "submitted",
      metadata: {
        relationship: evaluator.relationship,
        submittedAt: new Date(),
        lastSavedAt: new Date(),
      },
    });

    // Actualizar el feedback del evaluador
    evaluator.feedback = responses;
    evaluator.status = "completed";
    evaluator.completedAt = new Date();

    // Guardar los cambios en la evaluación
    await evaluation.save();

    // Invalidar caché
    const cacheKey = cacheService.generateKey("evaluation", req.params.id);
    await Promise.all([
      cacheService.delete(cacheKey),
      cacheService.delete(cacheService.generateListKey("evaluations")),
    ]);

    res.status(200).json({
      status: "success",
      message: "Feedback enviado correctamente",
      data: {
        feedback,
      },
    });
  } catch (error) {
    logger.error("Error al enviar feedback:", error);
    next(error);
  }
};

// Get pending evaluations for the current user
exports.getPendingEvaluations = async (req, res, next) => {
  try {
    const evaluations = await Evaluation.find({
      'evaluators.user': req.user._id,
      'evaluators.status': { $in: ['draft', 'in_progress', 'pending_review'] },
      'status': 'in_progress'
    })
    .populate({
      path: 'employee',
      select: 'position department user',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    })
    .select('evaluationType period categories evaluators');

    const pendingEvaluations = evaluations.map(evaluation => {
      const evaluator = evaluation.evaluators.find(
        e => e.user.toString() === req.user._id.toString()
      );

      return {
        id: evaluation._id,
        evaluationType: evaluation.evaluationType,
        evaluee: {
          name: `${evaluation.employee.user.firstName} ${evaluation.employee.user.lastName}`,
          position: evaluation.employee.position,
          department: evaluation.employee.department
        },
        dueDate: evaluation.period.endDate,
        status: evaluator.status,
        progress: evaluator.feedback ? 
          (evaluator.feedback.length / evaluation.categories.reduce((acc, cat) => acc + cat.criteria.length, 0)) * 100 : 0
      };
    });

    res.status(200).json({
      status: 'success',
      results: pendingEvaluations.length,
      data: pendingEvaluations
    });
  } catch (error) {
    logger.error('Error al obtener evaluaciones pendientes:', error);
    next(error);
  }
};

module.exports = exports;
