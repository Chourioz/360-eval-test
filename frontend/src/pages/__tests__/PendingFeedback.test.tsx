import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '@/test/utils';
import PendingFeedback from '../PendingFeedback';
import { usePendingEvaluations } from '@/hooks/useEvaluations';
import type { PendingEvaluation } from '@/services/evaluation.service';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    navigate: vi.fn(),
    state: {
      location: {
        pathname: '/'
      }
    }
  })
}));

// Mock Material-UI icons
vi.mock('@mui/icons-material', () => ({
  Assessment: () => 'AssessmentIcon',
  Schedule: () => 'ScheduleIcon',
  Edit: () => 'EditIcon'
}));

// Mock the usePendingEvaluations hook
vi.mock('@/hooks/useEvaluations');

// Mock framer-motion
vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    const MotionComponent = ({ children, ...props }: any) => {
      const Component = tag;
      return <Component {...props}>{children}</Component>;
    };
    return MotionComponent;
  };

  const motion = (Component: any) => {
    return ({ children, ...props }: any) => {
      return <Component {...props}>{children}</Component>;
    };
  };

  // Add static properties to motion function
  Object.assign(motion, {
    div: createMotionComponent('div'),
    span: createMotionComponent('span')
  });

  return {
    motion,
    AnimatePresence: ({ children }: any) => children
  };
});

const mockPendingEvaluations: PendingEvaluation[] = [
  {
    id: '1',
    evaluationType: '360',
    evaluee: {
      name: 'John Doe',
      position: 'Developer',
      department: 'Engineering'
    },
    dueDate: '2024-12-31',
    progress: 0,
    status: 'draft'
  }
];

describe('PendingFeedback', () => {
  it('renders loading state', () => {
    vi.mocked(usePendingEvaluations).mockReturnValue({
      evaluations: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn()
    });

    renderWithRouter(<PendingFeedback />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(usePendingEvaluations).mockReturnValue({
      evaluations: undefined,
      isLoading: false,
      error: new Error('Failed to load pending feedback'),
      refetch: vi.fn()
    });

    renderWithRouter(<PendingFeedback />);
    expect(screen.getByText(/error al cargar las evaluaciones pendientes/i)).toBeInTheDocument();
  });

  it('renders empty state when no pending feedback', () => {
    vi.mocked(usePendingEvaluations).mockReturnValue({
      evaluations: [],
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    renderWithRouter(<PendingFeedback />);
    expect(screen.getByText(/tienes 0 evaluaciones pendientes/i)).toBeInTheDocument();
  });

  it('renders pending feedback cards correctly', async () => {
    vi.mocked(usePendingEvaluations).mockReturnValue({
      evaluations: mockPendingEvaluations,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    renderWithRouter(<PendingFeedback />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Developer - Engineering')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  it('displays correct status chip', async () => {
    vi.mocked(usePendingEvaluations).mockReturnValue({
      evaluations: mockPendingEvaluations,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    renderWithRouter(<PendingFeedback />);

    await waitFor(() => {
      expect(screen.getByText('Por Comenzar')).toBeInTheDocument();
    });
  });

  it('shows progress indicator', async () => {
    const evaluationsWithProgress = [{
      ...mockPendingEvaluations[0],
      progress: 50
    }];

    vi.mocked(usePendingEvaluations).mockReturnValue({
      evaluations: evaluationsWithProgress,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    renderWithRouter(<PendingFeedback />);

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
}); 