const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Employee = require('../../src/models/Employee');
const Evaluation = require('../../src/models/Evaluation');

describe('Feedback Controller', () => {
  let adminToken;
  let managerToken;
  let employeeToken;
  let admin;
  let manager;
  let employee;
  let employeeObj;
  let evaluation;

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

    // Crear una evaluación para las pruebas
    evaluation = await Evaluation.create({
      employee: employeeObj._id,
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
      evaluators: [
        {
          user: manager._id,
          relationship: 'manager',
          status: 'pending'
        },
        {
          user: employee._id,
          relationship: 'self',
          status: 'pending'
        }
      ],
      status: 'in_progress'
    });
  });

  describe('GET /api/feedback/pending', () => {
    it('should get pending feedback for user', async () => {
      const res = await request(app)
        .get('/api/feedback/pending')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pendingFeedback).toHaveLength(1);
      expect(res.body.data.pendingFeedback[0].evaluationId.toString()).toBe(evaluation._id.toString());
    });

    it('should return empty array if no pending feedback', async () => {
      const res = await request(app)
        .get('/api/feedback/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pendingFeedback).toHaveLength(0);
    });
  });

  describe('GET /api/feedback/:id', () => {
    it('should get feedback details for authorized evaluator', async () => {
      const res = await request(app)
        .get(`/api/feedback/${evaluation._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.evaluation).toBeDefined();
      expect(res.body.data.evaluation.categories).toHaveLength(2);
    });

    it('should not get feedback details for unauthorized user', async () => {
      const res = await request(app)
        .get(`/api/feedback/${evaluation._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/feedback/:id/submit', () => {
    const validFeedback = {
      feedback: [
        {
          categoryId: null, // Se asignará en las pruebas
          criteriaId: null, // Se asignará en las pruebas
          score: 4,
          comment: 'Good performance'
        }
      ]
    };

    beforeEach(() => {
      validFeedback.feedback[0].categoryId = evaluation.categories[0]._id;
      validFeedback.feedback[0].criteriaId = evaluation.categories[0].criteria[0]._id;
    });

    it('should submit feedback successfully', async () => {
      const res = await request(app)
        .post(`/api/feedback/${evaluation._id}/submit`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validFeedback);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      // Verificar que el estado del evaluador se actualizó
      const updatedEvaluation = await Evaluation.findById(evaluation._id);
      const evaluator = updatedEvaluation.evaluators.find(
        e => e.user.toString() === manager._id.toString()
      );
      expect(evaluator.status).toBe('completed');
    });

    it('should not submit feedback with invalid scores', async () => {
      const invalidFeedback = {
        feedback: [
          {
            categoryId: evaluation.categories[0]._id,
            criteriaId: evaluation.categories[0].criteria[0]._id,
            score: 6, // Score inválido
            comment: 'Good performance'
          }
        ]
      };

      const res = await request(app)
        .post(`/api/feedback/${evaluation._id}/submit`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(invalidFeedback);

      expect(res.status).toBe(400);
    });

    it('should not submit feedback for completed evaluation', async () => {
      // Marcar la evaluación como completada
      await Evaluation.findByIdAndUpdate(evaluation._id, { status: 'completed' });

      const res = await request(app)
        .post(`/api/feedback/${evaluation._id}/submit`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validFeedback);

      expect(res.status).toBe(400);
    });

    it('should complete evaluation when all feedback is submitted', async () => {
      // Enviar feedback del manager
      await request(app)
        .post(`/api/feedback/${evaluation._id}/submit`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(validFeedback);

      // Enviar feedback del empleado
      const res = await request(app)
        .post(`/api/feedback/${evaluation._id}/submit`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(validFeedback);

      expect(res.status).toBe(200);

      // Verificar que la evaluación se completó
      const updatedEvaluation = await Evaluation.findById(evaluation._id);
      expect(updatedEvaluation.status).toBe('completed');
    });
  });

  describe('GET /api/feedback/summary', () => {
    beforeEach(async () => {
      // Simular una evaluación completada con feedback
      const completedEvaluation = await Evaluation.create({
        ...evaluation.toObject(),
        _id: undefined,
        status: 'completed',
        evaluators: [
          {
            user: manager._id,
            relationship: 'manager',
            status: 'completed',
            feedback: [
              {
                categoryId: evaluation.categories[0]._id,
                criteriaId: evaluation.categories[0].criteria[0]._id,
                score: 4,
                comment: 'Good performance'
              }
            ],
            submittedAt: new Date()
          }
        ]
      });
    });

    it('should get feedback summary for employee', async () => {
      const res = await request(app)
        .get('/api/feedback/summary')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary).toHaveLength(1);
    });

    it('should include average scores in summary', async () => {
      const res = await request(app)
        .get('/api/feedback/summary')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary[0].averageScores).toBeDefined();
      expect(res.body.data.summary[0].overallScore).toBeDefined();
    });
  });
}); 