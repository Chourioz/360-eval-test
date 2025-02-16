// User Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  user: User;
  position: string;
  department: string;
  manager?: Employee;
  startDate: string;
  status: 'active' | 'inactive';
  directReports: Employee[];
  skills: string[];
  metadata: {
    yearsOfExperience?: number;
    previousPositions?: {
      title: string;
      company: string;
      startDate: string;
      endDate: string;
    }[];
    certifications?: {
      name: string;
      issuer: string;
      date: string;
      expiryDate: string;
    }[];
  };
}

export interface Skill {
  name: string;
  level: number;
}

// Evaluation Types
export interface Evaluation {
  _id: string;
  employee: {
    _id: string;
    user: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    position: string;
    department: string;
  };
  evaluationType: 'self' | '360' | 'peer';
  period: {
    startDate: string;
    endDate: string;
  };
  status: 'draft' | 'in_progress' | 'completed';
  categories: Array<{
    name: string;
    weight: number;
    criteria: Array<{
      description: string;
      weight: number;
      _id: string;
    }>;
    _id: string;
  }>;
  evaluators: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    status: 'pending' | 'in_progress' | 'completed';
    feedback?: Array<{
      categoryId: string;
      criteriaId: string;
      rating: number;
      comment?: string;
    }>;
  }>;
  metadata: {
    createdBy: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    lastModifiedBy: string;
  };
  progress: number;
  averageScore: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface EvaluationCategory {
  _id: string;
  name: string;
  weight: number;
  criteria: EvaluationCriteria[];
}

export interface EvaluationCriteria {
  _id: string;
  name: string;
  description?: string;
  weight: number;
}

export interface Evaluator {
  user: User;
  relationship: 'self' | 'peer' | 'manager' | 'subordinate';
  status: 'pending' | 'completed';
  completedAt?: string;
  feedback: Array<{
    categoryId: string;
    criteriaId: string;
    score: number;
    comment?: string;
  }>;
}

// Feedback Types
export interface Feedback {
  id: string;
  evaluation: Evaluation;
  evaluator: User;
  employee: Employee;
  responses: FeedbackResponse[];
  overallComment: {
    strengths?: string;
    improvements?: string;
    goals?: string;
  };
  status: 'draft' | 'submitted';
  metadata: {
    relationship: 'self' | 'peer' | 'manager' | 'subordinate';
    submittedAt?: string;
    lastSavedAt?: string;
    timeSpent?: number;
  };
}

export interface FeedbackResponse {
  categoryId: string;
  criteriaId: string;
  rating: number;
  comment?: string;
}

// Auth Types
export interface AuthState {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'manager' | 'employee';
  position?: string;
  department?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
} 