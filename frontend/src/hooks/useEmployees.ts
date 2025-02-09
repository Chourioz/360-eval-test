import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';
import type { Employee } from '@/types';

interface UpdateEmployeeParams {
  id: string;
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    position?: string;
    department?: string;
    role?: 'admin' | 'manager' | 'employee';
    status?: 'active' | 'inactive';
    managerId?: string;
  };
}

export function useEmployees() {
  const queryClient = useQueryClient();

  const {
    data: employees,
    isLoading,
    error
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await employeeService.getEmployees();
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: UpdateEmployeeParams) =>
      employeeService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: employeeService.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });

  return {
    employees,
    isLoading,
    error,
    createEmployee: createMutation.mutate,
    updateEmployee: updateMutation.mutate,
    deleteEmployee: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error
  };
} 