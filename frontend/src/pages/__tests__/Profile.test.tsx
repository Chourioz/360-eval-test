import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@/test/utils';
import Profile from '../Profile';
import { useAuth } from '@/hooks/useAuth';
import type { User, Employee } from '@/types';
import { authService } from '@/services/auth.service';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth');

const mockUser: User = {
  _id: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'employee',
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

const mockEmployee: Employee = {
  _id: 'emp1',
  user: mockUser,
  position: 'Developer',
  department: 'Engineering',
  status: 'active',
  startDate: '2024-01-01',
  directReports: [],
  skills: [],
  metadata: {
    yearsOfExperience: 2
  }
};

describe('Profile', () => {
  it('renders loading state when isLoading is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: undefined,
      employee: undefined,
      isAuthenticated: true,
      isLoading: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updatePassword: vi.fn(),
      authService
    });

    render(<Profile />);
    // Since there's no explicit loading indicator, we can check that the user info is not rendered
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('renders user profile information correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      employee: mockEmployee,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updatePassword: vi.fn(),
      authService
    });

    render(<Profile />);

    // Check user name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check form inputs
    const firstNameInput = screen.getByRole('textbox', { name: /nombre/i });
    const lastNameInput = screen.getByRole('textbox', { name: /apellido/i });
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    
    expect(firstNameInput).toHaveValue('John');
    expect(lastNameInput).toHaveValue('Doe');
    expect(emailInput).toHaveValue('john@example.com');
    
    // Check role
    expect(screen.getByText('employee')).toBeInTheDocument();
  });

  it('handles password update submission', async () => {
    const mockUpdatePassword = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      employee: mockEmployee,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updatePassword: mockUpdatePassword,
      authService
    });

    render(<Profile />);

    // Find password section
    expect(screen.getByText('Cambiar Contraseña')).toBeInTheDocument();

    // Fill in password fields
    const currentPasswordInput = screen.getByLabelText('Contraseña Actual');
    const newPasswordInput = screen.getByLabelText('Nueva Contraseña');
    const confirmPasswordInput = screen.getByLabelText('Confirmar Nueva Contraseña');
    
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      });
    });

    // Check success message
    await waitFor(() => {
      expect(screen.getByText('Contraseña actualizada exitosamente')).toBeInTheDocument();
    });
  });
}); 