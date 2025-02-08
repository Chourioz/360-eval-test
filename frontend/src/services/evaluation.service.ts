import { apiService } from "./api";
import type { ApiResponse, Evaluation } from "@/types";

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

class EvaluationService {
  async getEvaluations(): Promise<ApiResponse<Evaluation[]>> {
    return apiService.get("/evaluations");
  }

  async getEvaluation(id: string): Promise<ApiResponse<Evaluation>> {
    return apiService.get(`/evaluations/${id}`);
  }

  async createEvaluation(data: CreateEvaluationData): Promise<ApiResponse<Evaluation>> {
    return apiService.post("/evaluations", data);
  }

  async updateEvaluation(
    id: string,
    data: UpdateEvaluationData
  ): Promise<ApiResponse<Evaluation>> {
    return apiService.patch(`/evaluations/${id}`, data);
  }

  async deleteEvaluation(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/evaluations/${id}`);
  }

  async startEvaluation(id: string): Promise<ApiResponse<Evaluation>> {
    return apiService.post(`/evaluations/${id}/start`, {});
  }

  async completeEvaluation(id: string): Promise<ApiResponse<Evaluation>> {
    return apiService.post(`/evaluations/${id}/complete`, {});
  }
}

export const evaluationService = new EvaluationService();
