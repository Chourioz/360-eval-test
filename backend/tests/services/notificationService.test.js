const mongoose = require('mongoose');
const NotificationService = require('../../src/services/notificationService');
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');
const Evaluation = require('../../src/models/Evaluation');

describe('NotificationService', () => {
  let testUser;
  let testEvaluation;
  let testEvaluator;

  beforeEach(async () => {
    // Crear usuario de prueba
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee'
    });

    // Crear evaluador de prueba
    testEvaluator = {
      user: testUser._id,
      relationship: 'manager',
      status: 'pending'
    };

    // Crear evaluación de prueba
    testEvaluation = await Evaluation.create({
      employee: new mongoose.Types.ObjectId(),
      evaluationType: '360',
      period: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      status: 'in_progress',
      evaluators: [testEvaluator],
      categories: [{
        name: 'Test Category',
        weight: 100,
        criteria: [{
          description: 'Test Criteria',
          weight: 100
        }]
      }],
      metadata: {
        createdBy: testUser._id,
        lastModifiedBy: testUser._id
      }
    });
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        recipient: testUser._id,
        type: 'evaluation_assigned',
        title: 'Test Notification',
        message: 'Test message',
        priority: 'high'
      };

      const notification = await NotificationService.createNotification(notificationData);
      
      expect(notification._id).toBeDefined();
      expect(notification.recipient.toString()).toBe(testUser._id.toString());
      expect(notification.type).toBe(notificationData.type);
      expect(notification.status).toBe('unread');
    });

    it('should throw error with invalid data', async () => {
      const invalidData = {
        recipient: testUser._id,
        type: 'invalid_type' // Tipo inválido
      };

      await expect(NotificationService.createNotification(invalidData))
        .rejects.toThrow();
    });
  });

  describe('Notification Types', () => {
    it('should create evaluation assigned notification', async () => {
      const notification = await NotificationService.notifyEvaluationAssigned(
        testEvaluation,
        testEvaluator
      );

      expect(notification.type).toBe('evaluation_assigned');
      expect(notification.recipient.toString()).toBe(testUser._id.toString());
      expect(notification.data.evaluationId.toString()).toBe(testEvaluation._id.toString());
      expect(notification.priority).toBe('high');
    });

    it('should create feedback requested notification', async () => {
      const notification = await NotificationService.notifyFeedbackRequested(
        testEvaluation,
        testEvaluator
      );

      expect(notification.type).toBe('feedback_requested');
      expect(notification.recipient.toString()).toBe(testUser._id.toString());
      expect(notification.data.evaluationId.toString()).toBe(testEvaluation._id.toString());
      expect(notification.priority).toBe('high');
    });

    it('should create feedback submitted notification', async () => {
      const notification = await NotificationService.notifyFeedbackSubmitted(
        testEvaluation,
        testEvaluator,
        testUser
      );

      expect(notification.type).toBe('feedback_submitted');
      expect(notification.recipient.toString()).toBe(testUser._id.toString());
      expect(notification.data.evaluationId.toString()).toBe(testEvaluation._id.toString());
      expect(notification.priority).toBe('medium');
    });

    it('should create evaluation completed notification', async () => {
      const notification = await NotificationService.notifyEvaluationCompleted(
        testEvaluation
      );

      expect(notification.type).toBe('evaluation_completed');
      expect(notification.data.evaluationId.toString()).toBe(testEvaluation._id.toString());
      expect(notification.priority).toBe('high');
    });

    it('should create reminder notification', async () => {
      const notification = await NotificationService.sendReminder(
        testEvaluation,
        testEvaluator
      );

      expect(notification.type).toBe('feedback_reminder');
      expect(notification.recipient.toString()).toBe(testUser._id.toString());
      expect(notification.data.evaluationId.toString()).toBe(testEvaluation._id.toString());
      expect(notification.priority).toBe('medium');
      expect(notification.expiresAt).toBeDefined();
    });
  });

  describe('Notification Management', () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await NotificationService.createNotification({
        recipient: testUser._id,
        type: 'evaluation_assigned',
        title: 'Test Notification',
        message: 'Test message',
        priority: 'high'
      });
    });

    it('should get unread notifications for user', async () => {
      const notifications = await NotificationService.getUnreadNotifications(testUser._id);
      expect(notifications).toBeInstanceOf(Array);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].status).toBe('unread');
    });

    it('should mark notification as read', async () => {
      const updatedNotification = await NotificationService.markAsRead(
        testNotification._id,
        testUser._id
      );
      expect(updatedNotification.status).toBe('read');
    });

    it('should delete notification', async () => {
      await NotificationService.deleteNotification(testNotification._id, testUser._id);
      const deletedNotification = await Notification.findById(testNotification._id);
      expect(deletedNotification).toBeNull();
    });

    it('should throw error when marking non-existent notification as read', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(NotificationService.markAsRead(fakeId, testUser._id))
        .rejects.toThrow('Notification not found');
    });
  });
}); 