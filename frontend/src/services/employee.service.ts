import { apiService } from './api';
import type { Employee, ApiResponse } from '@/types';

interface CreateEmployeeData {
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'inactive';
}

interface UpdateEmployeeData extends Partial<CreateEmployeeData> {}

interface CreateEmployeeResponse {
  employee: Employee;
  tempPassword: string;
}

interface DashboardStats {
  pendingEvaluations: number;
  monthlyFeedback: number;
  averageScore: string;
  teamCount: number;
  performanceData: Array<{
    month: string;
    score: number;
  }>;
  feedbackDistribution: Array<{
    name: string;
    value: number;
  }>;
}

class EmployeeService {
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    return apiService.get('/employees');
  }

  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    return apiService.get(`/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeeData): Promise<ApiResponse<CreateEmployeeResponse>> {
    return apiService.post('/employees', data);
  }

  async updateEmployee(id: string, data: UpdateEmployeeData): Promise<ApiResponse<Employee>> {
    return apiService.patch(`/employees/${id}`, data);
  }

  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/employees/${id}`);
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiService.get('/employees/me/dashboard');
  }
}

export const employeeService = new EmployeeService(); 