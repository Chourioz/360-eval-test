import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@/test/utils';
import Employees from '../Employees';
import { useEmployees } from '@/hooks/useEmployees';
import type { Employee } from '@/types';

// Mock the useEmployees hook
vi.mock('@/hooks/useEmployees');

const mockEmployees: Employee[] = [
  {
    _id: '1',
    user: {
      _id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'employee',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    position: 'Developer',
    department: 'Engineering',
    status: 'active',
    startDate: '2024-01-01',
    directReports: [],
    skills: [],
    metadata: {
      yearsOfExperience: 2
    }
  }
];

describe('Employees', () => {
  it('renders loading state', () => {
    vi.mocked(useEmployees).mockReturnValue({
      employees: [],
      isLoading: true,
      error: null,
      createEmployee: vi.fn(),
      updateEmployee: vi.fn(),
      deleteEmployee: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      createError: null,
      updateError: null,
      deleteError: null
    });

    render(<Employees />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useEmployees).mockReturnValue({
      employees: [],
      isLoading: false,
      error: new Error('Failed to load employees'),
      createEmployee: vi.fn(),
      updateEmployee: vi.fn(),
      deleteEmployee: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      createError: null,
      updateError: null,
      deleteError: null
    });

    render(<Employees />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('renders employees table correctly', async () => {
    vi.mocked(useEmployees).mockReturnValue({
      employees: mockEmployees,
      isLoading: false,
      error: null,
      createEmployee: vi.fn(),
      updateEmployee: vi.fn(),
      deleteEmployee: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      createError: null,
      updateError: null,
      deleteError: null
    });

    render(<Employees />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
    });
  });

  it('opens create employee form when clicking new employee button', async () => {
    vi.mocked(useEmployees).mockReturnValue({
      employees: mockEmployees,
      isLoading: false,
      error: null,
      createEmployee: vi.fn(),
      updateEmployee: vi.fn(),
      deleteEmployee: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      createError: null,
      updateError: null,
      deleteError: null
    });

    render(<Employees />);

    const newButton = screen.getByRole('button', { name: /nuevo empleado/i });
    fireEvent.click(newButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Nuevo Empleado' })).toBeInTheDocument();
    });
  });

  it('opens edit employee form when clicking edit button', async () => {
    vi.mocked(useEmployees).mockReturnValue({
      employees: mockEmployees,
      isLoading: false,
      error: null,
      createEmployee: vi.fn(),
      updateEmployee: vi.fn(),
      deleteEmployee: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      createError: null,
      updateError: null,
      deleteError: null
    });

    render(<Employees />);

    const editButton = screen.getByTestId('EditIcon').closest('button');
    if (!editButton) throw new Error('Edit button not found');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Editar Empleado' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });
  });
}); 