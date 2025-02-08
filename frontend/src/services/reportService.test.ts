import { reportService } from './reportService';
import type { Evaluation, Employee } from '@/types';

// Mock de jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn()
  }));
});

// Mock de jspdf-autotable
jest.mock('jspdf-autotable', () => jest.fn());

describe('ReportService', () => {
  const mockEmployee: Employee = {
    _id: '1',
    user: {
      _id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'employee',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    position: 'Developer',
    department: 'IT',
    startDate: new Date().toISOString(),
    status: 'active',
    skills: ['JavaScript', 'React'],
    directReports: [],
    metadata: {
      yearsOfExperience: 5,
      previousPositions: [{ title: 'Junior Developer', company: 'Tech Solutions', startDate: new Date().toISOString(), endDate: new Date().toISOString() }],
      certifications: [{ name: 'AWS Certified', issuer: 'Amazon Web Services', date: new Date().toISOString(), expiryDate: new Date().toISOString() }]
    }
  };

  const mockEvaluation: Evaluation = {
    _id: '1',
    employee: mockEmployee,
    evaluationType: '360',
    period: {
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString()
    },
    status: 'completed',
    categories: [
      {
        _id: '1',
        name: 'Technical Skills',
        weight: 50,
        criteria: [
          {
            _id: '1',
            name: 'Programming',
            description: 'Ability to write clean code',
            weight: 100
          }
        ]
      },
      {
        _id: '2',
        name: 'Soft Skills',
        weight: 50,
        criteria: [
          {
            _id: '2',
            name: 'Communication',
            description: 'Ability to communicate effectively',
            weight: 100
          }
        ]
      }
    ],
    evaluators: [
      {
        user: {
          _id: '2',
          email: 'manager@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'manager',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        relationship: 'manager',
        status: 'completed',
        feedback: [
          {
            categoryId: '1',
            criteriaId: '1',
            score: 4,
            comment: 'Good technical skills'
          },
          {
            categoryId: '2',
            criteriaId: '2',
            score: 5,
            comment: 'Excellent communication'
          }
        ]
      }
    ],
    metadata: {
      createdBy: {
        _id: '3',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      lastModifiedBy: {
        _id: '3',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  };

  describe('generateEvaluationReport', () => {
    it('should generate evaluation report', async () => {
      const doc = await reportService.generateEvaluationReport(mockEvaluation);
      expect(doc).toBeDefined();
    });

    it('should calculate correct category averages', () => {
      const average = (reportService as any).calculateCategoryAverage(
        mockEvaluation,
        'Technical Skills'
      );
      expect(average).toBe(4);
    });

    it('should calculate correct overall score', () => {
      const score = (reportService as any).calculateOverallScore(mockEvaluation);
      expect(score).toBe(4.5); // (4 * 0.5 + 5 * 0.5)
    });
  });

  describe('generateEmployeeReport', () => {
    it('should generate employee report', async () => {
      const doc = await reportService.generateEmployeeReport(mockEmployee, [mockEvaluation]);
      expect(doc).toBeDefined();
    });
  });

  describe('downloadPDF', () => {
    it('should call save method with correct filename', () => {
      const mockDoc = { save: jest.fn() };
      const filename = 'test.pdf';
      
      reportService.downloadPDF(mockDoc as any, filename);
      expect(mockDoc.save).toHaveBeenCalledWith(filename);
    });
  });
}); 