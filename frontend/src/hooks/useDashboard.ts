import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employee.service';

export function useDashboard() {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await employeeService.getDashboardStats();
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  return {
    stats: dashboardData,
    isLoading,
    error,
    refetch
  };
} 