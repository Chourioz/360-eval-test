import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/utils';
import Dashboard from '../Dashboard';
import { useDashboard } from '@/hooks/useDashboard';

// Mock the useDashboard hook
vi.mock('@/hooks/useDashboard');

// Mock the router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    state: {
      location: {
        pathname: '/'
      }
    }
  })
}));

describe('Dashboard', () => {
  it('renders loading state', () => {
    vi.mocked(useDashboard).mockReturnValue({
      stats: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<Dashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useDashboard).mockReturnValue({
      stats: undefined,
      isLoading: false,
      error: new Error('Failed to load dashboard'),
      refetch: vi.fn(),
    });

    render(<Dashboard />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('renders dashboard data correctly', async () => {
    const mockStats = {
      pendingEvaluations: 5,
      monthlyFeedback: 10,
      averageScore: '4.2',
      teamCount: 8,
      performanceData: [
        { month: 'Jan', score: 4.0 },
        { month: 'Feb', score: 4.2 },
      ],
      feedbackDistribution: [
        { name: 'Excellent', value: 30 },
        { name: 'Good', value: 45 },
      ],
    };

    vi.mocked(useDashboard).mockReturnValue({
      stats: mockStats,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<Dashboard />);

    await waitFor(() => {
      // Test numeric values
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      
      // Test headings
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Evaluaciones Pendientes')).toBeInTheDocument();
      expect(screen.getByText('Feedback Mensual')).toBeInTheDocument();
      expect(screen.getByText('Promedio de Desempeño')).toBeInTheDocument();
      expect(screen.getByText('Miembros del Equipo')).toBeInTheDocument();
      expect(screen.getByText('Tendencia de Desempeño')).toBeInTheDocument();
      expect(screen.getByText('Distribución de Feedback')).toBeInTheDocument();
    });
  });
}); 