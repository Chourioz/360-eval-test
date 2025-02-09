import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '@/test/utils';
import Evaluations from '../Evaluations';
import { useEvaluations } from '@/hooks/useEvaluations';
import { useEmployees } from '@/hooks/useEmployees';
import type { Evaluation } from '@/types';

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Add: () => 'AddIcon',
  Edit: () => 'EditIcon',
  Delete: () => 'DeleteIcon'
}));

// Mock both hooks
vi.mock('@/hooks/useEvaluations');
vi.mock('@/hooks/useEmployees');

const mockEvaluations: Evaluation[] = [{
  _id: '1',
  employee: {
    _id: 'emp1',
    user: {
      _id: 'user1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    },
    position: 'Developer',
    department: 'Engineering'
  },
  evaluationType: '360',
  period: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  status: 'in_progress',
  progress: 50,
  categories: [],
  evaluators: [],
  metadata: {
    createdBy: {
      _id: 'admin1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User'
    },
    lastModifiedBy: 'admin1'
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  __v: 0,
  averageScore: 0
}];

describe('Evaluations', () => {
  const commonMockProps = {
    startEvaluation: vi.fn(),
    isStarting: false,
    completeEvaluation: vi.fn(),
    completeLoading: false
  };

  beforeEach(() => {
    vi.mocked(useEmployees).mockReturnValue({
      employees: [],
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
  });

  it('renders loading state', () => {
    vi.mocked(useEvaluations).mockReturnValue({
      evaluations: [],
      isLoading: true,
      error: null,
      createEvaluation: vi.fn(),
      updateEvaluation: vi.fn(),
      deleteEvaluation: vi.fn(),
      isCreating: false,
      isUpdating: false,
      deleteLoading: false,
      totalResults: 0,
      ...commonMockProps
    });

    renderWithRouter(<Evaluations />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useEvaluations).mockReturnValue({
      evaluations: [],
      isLoading: false,
      error: new Error('Failed to load evaluations'),
      createEvaluation: vi.fn(),
      updateEvaluation: vi.fn(),
      deleteEvaluation: vi.fn(),
      isCreating: false,
      isUpdating: false,
      deleteLoading: false,
      totalResults: 0,
      ...commonMockProps
    });

    renderWithRouter(<Evaluations />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('renders evaluations table with data', async () => {
    vi.mocked(useEvaluations).mockReturnValue({
      evaluations: mockEvaluations,
      isLoading: false,
      error: null,
      createEvaluation: vi.fn(),
      updateEvaluation: vi.fn(),
      deleteEvaluation: vi.fn(),
      isCreating: false,
      isUpdating: false,
      deleteLoading: false,
      totalResults: 1,
      ...commonMockProps
    });

    renderWithRouter(<Evaluations />);

    await waitFor(() => {
      expect(screen.getByText(/john/i)).toBeInTheDocument();
      expect(screen.getByText(/doe/i)).toBeInTheDocument();
      expect(screen.getByText('360')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
    });
  });

  it('opens create evaluation form when clicking new evaluation button', async () => {
    const mockCreateEvaluation = vi.fn();
    vi.mocked(useEvaluations).mockReturnValue({
      evaluations: [],
      isLoading: false,
      error: null,
      createEvaluation: mockCreateEvaluation,
      updateEvaluation: vi.fn(),
      deleteEvaluation: vi.fn(),
      isCreating: false,
      isUpdating: false,
      deleteLoading: false,
      totalResults: 0,
      ...commonMockProps
    });

    renderWithRouter(<Evaluations />);
    
    const newButton = screen.getByRole('button', { name: /nueva/i });
    fireEvent.click(newButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
}); 