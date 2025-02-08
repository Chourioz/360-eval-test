import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationService } from '@/services/evaluation.service';
import type { Evaluation } from '@/types';

interface EvaluationsResponse {
  status: string;
  results: number;
  data: Evaluation[];
}

export function useEvaluations() {
  const queryClient = useQueryClient();

  const {
    data: evaluationsData,
    isLoading,
    error
  } = useQuery<EvaluationsResponse>({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const response = await evaluationService.getEvaluations();
      return response;
    },
    select: (response) => response // Keep the full response structure
  });

  const { mutate: createEvaluation, isPending: isCreating } = useMutation({
    mutationFn: evaluationService.createEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  const { mutate: updateEvaluation, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      evaluationService.updateEvaluation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  const { mutate: startEvaluation, isPending: isStarting } = useMutation({
    mutationFn: evaluationService.startEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  const { mutate: completeEvaluation, isPending: completeLoading } = useMutation({
    mutationFn: evaluationService.completeEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  const { mutate: deleteEvaluation, isPending: deleteLoading } = useMutation({
    mutationFn: evaluationService.deleteEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    }
  });

  return {
    evaluations: evaluationsData?.data || [],
    totalResults: evaluationsData?.results || 0,
    isLoading,
    error,
    createEvaluation,
    isCreating,
    updateEvaluation,
    isUpdating,
    startEvaluation,
    isStarting,
    completeEvaluation,
    completeLoading,
    deleteEvaluation,
    deleteLoading
  };
} 