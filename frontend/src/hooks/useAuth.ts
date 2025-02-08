import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { LoginCredentials, RegisterData } from '@/types';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: authData, isLoading: isAuthLoading, isError } = useQuery({
    queryKey: ['auth'],
    queryFn: authService.getProfile,
    retry: 1,
    enabled: !!localStorage.getItem('token'),
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.updatePassword(currentPassword, newPassword),
  });

  return {
    user: authData?.data?.user,
    employee: authData?.data?.employee,
    isAuthenticated: !!authData?.data?.user && !isError,
    isLoading: isAuthLoading || loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    updatePassword: updatePasswordMutation.mutate,
  };
} 