import { apiService as api } from "@/services/api";
import type { Evaluation, FeedbackResponse } from "@/types";
import type { ApiResponse } from "@/types";

interface CreateEvaluationData {
  employee: string;
  evaluationType: "self" | "peer" | "manager" | "360";
  period: {
    startDate: string;
    endDate: string;
  };
  categories: Array<{
    name: string;
    description?: string;
    weight: number;
    criteria: Array<{
      description: string;
      weight: number;
    }>;
  }>;
  evaluators: Array<{
    user: string;
    relationship: "self" | "peer" | "manager" | "subordinate";
  }>;
}

interface UpdateEvaluationData extends Partial<CreateEvaluationData> {}

export interface PendingEvaluation {
  id: string;
  evaluationType: string;
  evaluee: {
    name: string;
    position: string;
    department: string;
  };
  dueDate: string;
  progress: number;
  status: 'draft' | 'in_progress' | 'pending_review';
}

class EvaluationService {
  async getEvaluations() {
    const response = await api.get<{
      status: string;
      results: number;
      data: Evaluation[];
    }>("/evaluations");
    return response;
  }

  async getEvaluation(id: string) {
    const response = await api.get<ApiResponse<Evaluation>>(
      `/evaluations/${id}`
    );
    console.log("RESPONSE ===> ", response);
    return response;
  }

  async createEvaluation(
    data: CreateEvaluationData
  ): Promise<ApiResponse<Evaluation>> {
    return api.post("/evaluations", data);
  }

  async updateEvaluation(
    id: string,
    data: UpdateEvaluationData
  ): Promise<ApiResponse<Evaluation>> {
    return api.patch(`/evaluations/${id}`, data);
  }

  async deleteEvaluation(id: string) {
    const response = await api.delete<ApiResponse<void>>(`/evaluations/${id}`);
    return response.data;
  }

  async startEvaluation(id: string): Promise<ApiResponse<Evaluation>> {
    const response = await api.post<ApiResponse<Evaluation>>(`/evaluations/${id}/start`);
    return response;
  }

  async completeEvaluation(id: string) {
    const response = await api.post<ApiResponse<Evaluation>>(
      `/evaluations/${id}/complete`,
      {}
    );
    return response.data;
  }

  async submitFeedback(evaluationId: string, responses: FeedbackResponse[]) {
    const response = await api.post<ApiResponse<void>>(
      `/evaluations/${evaluationId}/feedback`,
      { responses }
    );
    return response.data;
  }

  async getPendingEvaluations(): Promise<ApiResponse<PendingEvaluation[]>> {
    return api.get<PendingEvaluation[]>('/evaluations/pending');
  }
}

export const evaluationService = new EvaluationService();
