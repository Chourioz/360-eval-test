const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Employee = require('../../src/models/Employee');
const Evaluation = require('../../src/models/Evaluation');

describe('Evaluation Controller', () => {
  let adminToken;
  let managerToken;
  let employeeToken;
  let admin;
  let manager;
  let employee;
  let employeeObj;

  beforeEach(async () => {
    // Crear usuarios para las pruebas
    admin = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    manager = await User.create({
      email: 'manager@example.com',
      password: 'password123',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager'
    });

    employee = await User.create({
      email: 'employee@example.com',
      password: 'password123',
      firstName: 'Employee',
      lastName: 'User',
      role: 'employee'
    });

    // Crear empleado
    employeeObj = await Employee.create({
      user: employee._id,
      position: 'Developer',
      department: 'Technology',
      startDate: new Date()
    });

    // Generar tokens
    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    managerToken = jwt.sign({ id: manager._id }, process.env.JWT_SECRET);
    employeeToken = jwt.sign({ id: employee._id }, process.env.JWT_SECRET);
  });

  const validEvaluationData = {
    employee: null, // Se asignará en las pruebas
    evaluationType: '360',
    period: {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    },
    categories: [
      {
        name: 'Technical Skills',
        weight: 50,
        criteria: [
          {
            description: 'Programming Skills',
            weight: 50
          },
          {
            description: 'Problem Solving',
            weight: 50
          }
        ]
      },
      {
        name: 'Soft Skills',
        weight: 50,
        criteria: [
          {
            description: 'Communication',
            weight: 50
          },
          {
            description: 'Teamwork',
            weight: 50
          }
        ]
      }
    ],
    evaluators: []
  };

  describe('POST /api/evaluations', () => {
    beforeEach(() => {
      validEvaluationData.employee = employeeObj._id;
      validEvaluationData.evaluators = [
        {
          user: manager._id,
          relationship: 'manager'
        },
        {
          user: employee._id,
          relationship: 'self'
        }
      ];
    });

    it('should create evaluation successfully as admin', async () => {
      const res = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validEvaluationData);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.evaluation).toBeDefined();
      expect(res.body.data.evaluation.status).toBe('draft');
    });

    it('should create evaluation successfully as manager', async () => {
      const res = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validEvaluationData);

      expect(res.status).toBe(201);
    });

    it('should not allow employee to create evaluation', async () => {
      const res = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(validEvaluationData);

      expect(res.status).toBe(403);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/evaluations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/evaluations', () => {
    beforeEach(async () => {
      validEvaluationData.employee = employeeObj._id;
      validEvaluationData.evaluators = [
        {
          user: manager._id,
          relationship: 'manager'
        }
      ];
      await Evaluation.create(validEvaluationData);
    });

    it('should get all evaluations as admin', async () => {
      const res = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluations).toHaveLength(1);
    });

    it('should get only relevant evaluations as employee', async () => {
      const res = await request(app)
        .get('/api/evaluations')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluations).toHaveLength(1);
    });

    it('should filter evaluations by status', async () => {
      const res = await request(app)
        .get('/api/evaluations')
        .query({ status: 'draft' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluations).toHaveLength(1);
    });
  });

  describe('GET /api/evaluations/:id', () => {
    let evaluation;

    beforeEach(async () => {
      validEvaluationData.employee = employeeObj._id;
      validEvaluationData.evaluators = [
        {
          user: manager._id,
          relationship: 'manager'
        }
      ];
      evaluation = await Evaluation.create(validEvaluationData);
    });

    it('should get evaluation by id', async () => {
      const res = await request(app)
        .get(`/api/evaluations/${evaluation._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluation._id.toString()).toBe(evaluation._id.toString());
    });

    it('should not get evaluation with invalid id', async () => {
      const res = await request(app)
        .get('/api/evaluations/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/evaluations/:id', () => {
    let evaluation;

    beforeEach(async () => {
      validEvaluationData.employee = employeeObj._id;
      validEvaluationData.evaluators = [
        {
          user: manager._id,
          relationship: 'manager'
        }
      ];
      evaluation = await Evaluation.create(validEvaluationData);
    });

    it('should update evaluation successfully', async () => {
      const updateData = {
        evaluationType: 'peer',
        'period.endDate': '2024-06-30'
      };

      const res = await request(app)
        .patch(`/api/evaluations/${evaluation._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluation.evaluationType).toBe('peer');
    });

    it('should not update evaluation in progress without admin role', async () => {
      await Evaluation.findByIdAndUpdate(evaluation._id, { status: 'in_progress' });

      const res = await request(app)
        .patch(`/api/evaluations/${evaluation._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ evaluationType: 'peer' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/evaluations/:id/start', () => {
    let evaluation;

    beforeEach(async () => {
      validEvaluationData.employee = employeeObj._id;
      validEvaluationData.evaluators = [
        {
          user: manager._id,
          relationship: 'manager'
        }
      ];
      evaluation = await Evaluation.create(validEvaluationData);
    });

    it('should start evaluation successfully', async () => {
      const res = await request(app)
        .post(`/api/evaluations/${evaluation._id}/start`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluation.status).toBe('in_progress');
    });

    it('should not start already started evaluation', async () => {
      await Evaluation.findByIdAndUpdate(evaluation._id, { status: 'in_progress' });

      const res = await request(app)
        .post(`/api/evaluations/${evaluation._id}/start`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
}); 