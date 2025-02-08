const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app'); // Necesitaremos crear este archivo
const User = require('../../src/models/User');
const Employee = require('../../src/models/Employee');

describe('Auth Controller', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'employee',
    position: 'Developer',
    department: 'Technology'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validUserData.email);
      expect(res.body.data.user.password).toBeUndefined();

      // Verificar que se creó el empleado
      const employee = await Employee.findOne({ user: res.body.data.user.id });
      expect(employee).toBeDefined();
      expect(employee.position).toBe(validUserData.position);
      expect(employee.department).toBe(validUserData.department);
    });

    it('should not register user with existing email', async () => {
      await User.create(validUserData);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/email already in use/i);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create(validUserData);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validUserData.email);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toMatch(/incorrect email or password/i);
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validUserData.password
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create(validUserData);
      token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    });

    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validUserData.email);
    });

    it('should not access profile without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });

    it('should not access profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/auth/update-password', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create(validUserData);
      token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    });

    it('should update password successfully', async () => {
      const res = await request(app)
        .patch('/api/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: validUserData.password,
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();

      // Verificar que la nueva contraseña funciona
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'newpassword123'
        });

      expect(loginRes.status).toBe(200);
    });

    it('should not update password with incorrect current password', async () => {
      const res = await request(app)
        .patch('/api/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });
}); 