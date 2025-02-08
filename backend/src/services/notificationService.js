const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class NotificationService {
  static async createNotification(data) {
    try {
      const notification = await Notification.create(data);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  static async notifyEvaluationAssigned(evaluation, evaluator) {
    const notification = {
      recipient: evaluator.user,
      type: 'evaluation_assigned',
      title: 'Nueva Evaluación Asignada',
      message: `Has sido asignado como evaluador en una evaluación ${evaluation.evaluationType}.`,
      data: {
        evaluationId: evaluation._id,
        senderId: evaluation.createdBy
      },
      priority: 'high'
    };

    return this.createNotification(notification);
  }

  static async notifyFeedbackRequested(evaluation, evaluator) {
    const notification = {
      recipient: evaluator.user,
      type: 'feedback_requested',
      title: 'Feedback Solicitado',
      message: 'Se requiere tu feedback para una evaluación en curso.',
      data: {
        evaluationId: evaluation._id
      },
      priority: 'high'
    };

    return this.createNotification(notification);
  }

  static async notifyFeedbackSubmitted(evaluation, evaluator, submitter) {
    const notification = {
      recipient: evaluator.user,
      type: 'feedback_submitted',
      title: 'Feedback Recibido',
      message: 'Un evaluador ha enviado su feedback.',
      data: {
        evaluationId: evaluation._id,
        senderId: submitter._id
      },
      priority: 'medium'
    };

    return this.createNotification(notification);
  }

  static async notifyEvaluationCompleted(evaluation) {
    const notification = {
      recipient: evaluation.employee,
      type: 'evaluation_completed',
      title: 'Evaluación Completada',
      message: 'Tu evaluación ha sido completada. Ya puedes ver los resultados.',
      data: {
        evaluationId: evaluation._id
      },
      priority: 'high'
    };

    return this.createNotification(notification);
  }

  static async sendReminder(evaluation, evaluator, type = 'feedback') {
    const notification = {
      recipient: evaluator.user,
      type: type === 'feedback' ? 'feedback_reminder' : 'evaluation_reminder',
      title: 'Recordatorio',
      message: type === 'feedback' 
        ? 'Tienes feedback pendiente por enviar.'
        : 'Tienes una evaluación pendiente por completar.',
      data: {
        evaluationId: evaluation._id
      },
      priority: 'medium',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expira en 7 días
    };

    return this.createNotification(notification);
  }

  static async getUnreadNotifications(userId) {
    return Notification.getUnreadByUser(userId);
  }

  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification.markAsRead();
  }

  static async deleteNotification(notificationId, userId) {
    return Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
  }
}

module.exports = NotificationService; 