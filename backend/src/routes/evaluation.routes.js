const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluation.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { validateEvaluation, validateEvaluationUpdate } = require('../middlewares/validators');

// Proteger todas las rutas
router.use(verifyToken);

// Rutas públicas (para usuarios autenticados)
router.get('/', evaluationController.getAllEvaluations);
router.get('/:id', evaluationController.getEvaluation);

// Ruta para iniciar evaluación - accesible para admin, manager y el empleado evaluado
router.post('/:id/start', evaluationController.startEvaluation);

// Ruta para enviar feedback - accesible para evaluadores asignados
router.post('/:id/feedback', evaluationController.submitFeedback);

// Ruta para completar evaluación - accesible para admin, manager y el empleado en caso de autoevaluación
router.post('/:id/complete', evaluationController.completeEvaluation);

// Rutas restringidas a admin y manager
router.use(restrictTo('admin', 'manager'));

// Usar validación completa solo para creación
router.post('/', validateEvaluation, evaluationController.createEvaluation);

module.exports = router; 