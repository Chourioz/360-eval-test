import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationService } from '@/services/evaluation.service';
import type { Evaluation, ApiResponse } from '@/types';

export function useEvaluations() {
  const queryClient = useQueryClient();

  const {
    data: evaluations,
    isLoading,
    error
  } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const response = await evaluationService.getEvaluations();
      console.log("EVALUATIONS", JSON.stringify(response, null, 2));
      return response.data;
    }
  });

  const { mutate: createEvaluation, isPending: createLoading, error: createError } = useMutation({
    mutationFn: evaluationService.createEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  const { mutate: updateEvaluation, isPending: updateLoading, error: updateError } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof evaluationService.updateEvaluation>[1] }) =>
      evaluationService.updateEvaluation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  const { mutate: deleteEvaluation, isPending: deleteLoading, error: deleteError } = useMutation({
    mutationFn: evaluationService.deleteEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  const { mutate: startEvaluation, isPending: startLoading, error: startError } = useMutation({
    mutationFn: evaluationService.startEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  const { mutate: completeEvaluation, isPending: completeLoading, error: completeError } = useMutation({
    mutationFn: evaluationService.completeEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  return {
    evaluations,
    isLoading,
    error,
    createEvaluation,
    createLoading,
    createError,
    updateEvaluation,
    updateLoading,
    updateError,
    deleteEvaluation,
    deleteLoading,
    deleteError,
    startEvaluation,
    startLoading,
    startError,
    completeEvaluation,
    completeLoading,
    completeError
  };
} 