const mongoose = require('mongoose');
const Notification = require('../../src/models/Notification');
const User = require('../../src/models/User');

describe('Notification Model Test', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee'
    });
  });

  const validNotificationData = {
    recipient: null, // Se asignará en cada test
    type: 'evaluation_assigned',
    title: 'Nueva Evaluación',
    message: 'Has sido asignado a una nueva evaluación',
    data: {
      evaluationId: new mongoose.Types.ObjectId(),
      senderId: new mongoose.Types.ObjectId()
    },
    priority: 'high'
  };

  it('should create & save notification successfully', async () => {
    const validNotification = new Notification({
      ...validNotificationData,
      recipient: testUser._id
    });
    const savedNotification = await validNotification.save();
    
    expect(savedNotification._id).toBeDefined();
    expect(savedNotification.recipient.toString()).toBe(testUser._id.toString());
    expect(savedNotification.type).toBe(validNotificationData.type);
    expect(savedNotification.status).toBe('unread'); // valor por defecto
  });

  it('should fail to save notification without required fields', async () => {
    const notificationWithoutRequired = new Notification({
      recipient: testUser._id
    });
    
    let err;
    try {
      await notificationWithoutRequired.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.type).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.message).toBeDefined();
  });

  it('should fail to save notification with invalid type', async () => {
    const notificationWithInvalidType = new Notification({
      ...validNotificationData,
      recipient: testUser._id,
      type: 'invalid_type'
    });
    
    let err;
    try {
      await notificationWithInvalidType.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.type).toBeDefined();
  });

  it('should mark notification as read', async () => {
    const notification = new Notification({
      ...validNotificationData,
      recipient: testUser._id
    });
    await notification.save();
    
    await notification.markAsRead();
    expect(notification.status).toBe('read');
    
    // Verificar que el cambio se guardó en la base de datos
    const updatedNotification = await Notification.findById(notification._id);
    expect(updatedNotification.status).toBe('read');
  });

  it('should create multiple notifications in batch', async () => {
    const notifications = [
      {
        ...validNotificationData,
        recipient: testUser._id,
        title: 'Notification 1'
      },
      {
        ...validNotificationData,
        recipient: testUser._id,
        title: 'Notification 2'
      }
    ];
    
    const savedNotifications = await Notification.createMany(notifications);
    expect(savedNotifications).toHaveLength(2);
    expect(savedNotifications[0].title).toBe('Notification 1');
    expect(savedNotifications[1].title).toBe('Notification 2');
  });

  it('should get unread notifications for user', async () => {
    // Crear algunas notificaciones de prueba
    await Notification.create([
      {
        ...validNotificationData,
        recipient: testUser._id,
        title: 'Unread 1'
      },
      {
        ...validNotificationData,
        recipient: testUser._id,
        title: 'Unread 2'
      },
      {
        ...validNotificationData,
        recipient: testUser._id,
        title: 'Read 1',
        status: 'read'
      }
    ]);
    
    const unreadNotifications = await Notification.getUnreadByUser(testUser._id);
    expect(unreadNotifications).toHaveLength(2);
    expect(unreadNotifications.every(n => n.status === 'unread')).toBe(true);
  });

  it('should automatically expire notifications', async () => {
    const notification = new Notification({
      ...validNotificationData,
      recipient: testUser._id,
      expiresAt: new Date(Date.now() - 1000) // Fecha en el pasado
    });
    await notification.save();
    
    // Esperar un momento para que MongoDB procese la expiración
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const expiredNotification = await Notification.findById(notification._id);
    expect(expiredNotification).toBeNull();
  });
}); 