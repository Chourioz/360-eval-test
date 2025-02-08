const NotificationService = require('../services/notificationService');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getNotifications = catchAsync(async (req, res) => {
  const notifications = await NotificationService.getUnreadNotifications(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: {
      notifications
    }
  });
});

exports.markAsRead = catchAsync(async (req, res) => {
  const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
  
  if (!notification) {
    throw new AppError('No notification found with that ID', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
});

exports.deleteNotification = catchAsync(async (req, res) => {
  const notification = await NotificationService.deleteNotification(req.params.id, req.user._id);
  
  if (!notification) {
    throw new AppError('No notification found with that ID', 404);
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Endpoint para marcar todas las notificaciones como leídas
exports.markAllAsRead = catchAsync(async (req, res) => {
  await NotificationService.markAllAsRead(req.user._id);
  
  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read'
  });
});

// Endpoint para obtener el conteo de notificaciones no leídas
exports.getUnreadCount = catchAsync(async (req, res) => {
  const count = await NotificationService.getUnreadCount(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: {
      count
    }
  });
}); 