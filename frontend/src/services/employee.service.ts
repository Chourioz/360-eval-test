import { apiService } from './api';
import type { Employee, ApiResponse } from '@/types';

class EmployeeService {
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    return apiService.get('/employees');
  }

  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    return apiService.get(`/employees/${id}`);
  }

  async createEmployee(data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return apiService.post('/employees', data);
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return apiService.patch(`/employees/${id}`, data);
  }

  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/employees/${id}`);
  }
}

export const employeeService = new EmployeeService(); 