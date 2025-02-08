import { 
  createRouter, 
  createRoute, 
  createRootRoute,
  Outlet,
  redirect,
  Navigate
} from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Evaluations from '@/pages/Evaluations';
import MyEvaluations from '@/pages/MyEvaluations';
import PendingFeedback from '@/pages/PendingFeedback';
import Employees from '@/pages/Employees';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import MainLayout from '@/components/layout/MainLayout';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import EvaluationForm from '@/pages/EvaluationForm';

// Root Route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </>
  ),
  errorComponent: ({ error }) => {
    // Prevent infinite redirects by checking if we're already on the login page
    if (error.message === 'UNAUTHORIZED' && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      return <Navigate to="/login" />;
    }
    return <NotFound />;
  },
});

// Public Routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginForm,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterForm,
});

const unauthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/unauthorized',
  component: Unauthorized,
});

// Protected Layout Route
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('UNAUTHORIZED');
    }
    // Let the component handle the actual auth state
    return null;
  },
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
});

// Protected Routes
const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/',
  component: Dashboard,
});

const profileRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/profile',
  component: Profile,
});

// Admin and Manager Routes
const evaluationsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/evaluations',
  component: Evaluations,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({
        to: '/login',
        replace: true
      });
    }
  }
});

const employeesRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/employees',
  component: Employees,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({
        to: '/login',
        replace: true
      });
    }
  }
});

// Employee Routes
const myEvaluationsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/my-evaluations',
  component: MyEvaluations,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({
        to: '/login',
        replace: true
      });
    }
  }
});

// Admin Routes
const settingsRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/settings',
  component: Settings,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({
        to: '/login',
        replace: true
      });
    }
  }
});

const pendingFeedbackRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/pending-feedback',
  component: PendingFeedback,
});

export const evaluationFormRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/evaluations/$id',
  component: EvaluationForm,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({
        to: '/login',
        replace: true
      });
    }
  }
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFound,
});

// Create and export the router
const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  unauthorizedRoute,
  notFoundRoute,
  protectedLayoutRoute.addChildren([
    dashboardRoute,
    profileRoute,
    evaluationsRoute,
    employeesRoute,
    myEvaluationsRoute,
    settingsRoute,
    pendingFeedbackRoute,
    evaluationFormRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
}); 