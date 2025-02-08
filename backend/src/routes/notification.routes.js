const express = require('express');
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Proteger todas las rutas
router.use(verifyToken);

// Rutas para notificaciones
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/mark-read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 