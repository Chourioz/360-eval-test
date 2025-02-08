const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluation.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { validateEvaluation } = require('../middlewares/validators');

// Proteger todas las rutas
router.use(verifyToken);

// Rutas públicas (para usuarios autenticados)
router.get('/', evaluationController.getAllEvaluations);
router.get('/:id', evaluationController.getEvaluation);

// Rutas restringidas a admin y manager
const restrictToAdminAndManager = restrictTo('admin', 'manager');
router.use(restrictToAdminAndManager);

router.post('/', validateEvaluation, evaluationController.createEvaluation);
router.patch('/:id', validateEvaluation, evaluationController.updateEvaluation);
router.delete('/:id', evaluationController.deleteEvaluation);

// Rutas especiales
router.post('/:id/start', evaluationController.startEvaluation);
router.post('/:id/complete', evaluationController.completeEvaluation);

module.exports = router; 