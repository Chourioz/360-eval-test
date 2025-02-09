import { apiService } from "./api";
import type {
  LoginCredentials,
  RegisterData,
  ApiResponse,
  User,
  Employee,
} from "@/types";

class AuthService {
  private tokenKey = "token";

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ data: User; token: string; status: string }> {
    const response = await apiService.post<{
      data: User;
      token: string;
      status: string;
    }>("/auth/login", credentials);
    console.log(response);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(
    data: RegisterData
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await apiService.post<
      ApiResponse<{ user: User; token: string }>
    >("/auth/register", data);
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async getProfile(): Promise<
    ApiResponse<{ user: User; employee?: Employee }>
  > {
    return apiService.get<ApiResponse<{ user: User; employee?: Employee }>>(
      "/auth/me"
    );
  }

  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    return apiService.patch<ApiResponse<void>>("/auth/password", {
      currentPassword,
      newPassword,
    });
  }

  logout(): void {
    this.removeToken();
  }

  // Password recovery methods
  forgotPassword(email: string): Promise<any> {
    return apiService.post("/auth/forgot-password", { email });
  }

  resetPassword(token: string, password: string): Promise<any> {
    return apiService.post("/auth/reset-password", { token, password });
  }

  verifyResetToken(token: string): Promise<any> {
    return apiService.post("/auth/verify-reset-token", { token });
  }
}

export const authService = new AuthService();
