const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { verifyToken } = require('../middlewares/auth');
const { validateFeedback } = require('../middlewares/validators');

// Proteger todas las rutas
router.use(verifyToken);

// Rutas para obtener feedback
router.get('/pending', feedbackController.getPendingFeedback);
router.get('/summary', feedbackController.getFeedbackSummary);
router.get('/:id', feedbackController.getFeedbackDetails);

// Ruta para enviar feedback
router.post('/:id/submit', validateFeedback, feedbackController.submitFeedback);

module.exports = router; 