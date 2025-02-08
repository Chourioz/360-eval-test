const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Notification = require('../../src/models/Notification');

describe('Notification Controller', () => {
  let testUser;
  let token;
  let testNotification;

  beforeEach(async () => {
    // Crear usuario de prueba
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee'
    });

    // Generar token
    token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);

    // Crear notificación de prueba
    testNotification = await Notification.create({
      recipient: testUser._id,
      type: 'evaluation_assigned',
      title: 'Test Notification',
      message: 'Test message',
      priority: 'high'
    });
  });

  describe('GET /api/notifications', () => {
    it('should get user notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.notifications.length).toBeGreaterThan(0);
    });

    it('should not get notifications without auth token', async () => {
      const res = await request(app)
        .get('/api/notifications');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should get unread notifications count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.count).toBeDefined();
      expect(typeof res.body.data.count).toBe('number');
    });
  });

  describe('PATCH /api/notifications/:id/mark-read', () => {
    it('should mark notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${testNotification._id}/mark-read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.notification.status).toBe('read');

      // Verificar en la base de datos
      const updatedNotification = await Notification.findById(testNotification._id);
      expect(updatedNotification.status).toBe('read');
    });

    it('should not mark other users notification as read', async () => {
      // Crear otro usuario y su notificación
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'User'
      });

      const otherNotification = await Notification.create({
        recipient: otherUser._id,
        type: 'evaluation_assigned',
        title: 'Other Notification',
        message: 'Test message',
        priority: 'high'
      });

      const res = await request(app)
        .patch(`/api/notifications/${otherNotification._id}/mark-read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      // Crear múltiples notificaciones
      await Notification.create([
        {
          recipient: testUser._id,
          type: 'evaluation_assigned',
          title: 'Test 1',
          message: 'Test message',
          priority: 'high'
        },
        {
          recipient: testUser._id,
          type: 'feedback_requested',
          title: 'Test 2',
          message: 'Test message',
          priority: 'medium'
        }
      ]);

      const res = await request(app)
        .post('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      // Verificar que todas las notificaciones están marcadas como leídas
      const notifications = await Notification.find({ recipient: testUser._id });
      expect(notifications.every(n => n.status === 'read')).toBe(true);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete notification', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${testNotification._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      // Verificar que la notificación fue eliminada
      const deletedNotification = await Notification.findById(testNotification._id);
      expect(deletedNotification).toBeNull();
    });

    it('should not delete other users notification', async () => {
      // Crear otro usuario y su notificación
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'User'
      });

      const otherNotification = await Notification.create({
        recipient: otherUser._id,
        type: 'evaluation_assigned',
        title: 'Other Notification',
        message: 'Test message',
        priority: 'high'
      });

      const res = await request(app)
        .delete(`/api/notifications/${otherNotification._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);

      // Verificar que la notificación aún existe
      const notification = await Notification.findById(otherNotification._id);
      expect(notification).toBeDefined();
    });
  });
}); 