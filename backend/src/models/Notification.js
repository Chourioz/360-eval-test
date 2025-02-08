const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'evaluation_assigned',
      'feedback_requested',
      'feedback_submitted',
      'evaluation_completed',
      'evaluation_reminder',
      'feedback_reminder',
      'mention'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Evaluation'
    },
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback'
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Método para marcar como leída
notificationSchema.methods.markAsRead = async function() {
  this.status = 'read';
  return this.save();
};

// Método estático para crear notificaciones en lote
notificationSchema.statics.createMany = async function(notifications) {
  return this.insertMany(notifications);
};

// Método estático para obtener notificaciones no leídas de un usuario
notificationSchema.statics.getUnreadByUser = async function(userId) {
  return this.find({
    recipient: userId,
    status: 'unread'
  })
  .sort('-createdAt')
  .populate('data.senderId', 'firstName lastName')
  .populate('data.evaluationId', 'evaluationType period');
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 