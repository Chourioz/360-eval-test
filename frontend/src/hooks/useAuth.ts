import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginCredentials, RegisterData, User, Employee } from '@/types';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    onSuccess: (response) => {
      queryClient.setQueryData(['auth'], {
        data: {
          user: response.data,
          token: response.token
        }
      });
      navigate({ to: '/', replace: true });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
      navigate({ to: '/', replace: true });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.clear();
      navigate({ to: '/login', replace: true });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authService.updatePassword(currentPassword, newPassword),
  });

  const user = authData?.data?.user;
  const employee = authData?.data?.employee;
  const isAuthenticated = !!user && !isError;
  const error = loginMutation.error || registerMutation.error;
  const login = loginMutation.mutate;
  const register = registerMutation.mutate;
  const logout = logoutMutation.mutate;
  const updatePassword = updatePasswordMutation.mutate;

  return {
    user,
    employee,
    isAuthenticated,
    isLoading: isAuthLoading || loginMutation.isPending || registerMutation.isPending,
    error,
    login,
    register,
    logout,
    updatePassword,
    authService
  };
} 