import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import React from 'react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Add ResizeObserver to global
global.ResizeObserver = ResizeObserverMock;

// Create a custom render function that includes providers
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false
    }
  }
});

// Mock Framer Motion
vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    const MotionComponent = React.forwardRef((props: any, ref: any) => {
      const { children, variants, initial, animate, whileHover, ...rest } = props;
      return React.createElement(tag, { ref, ...rest }, children);
    });
    MotionComponent.displayName = `Motion${tag.charAt(0).toUpperCase() + tag.slice(1)}`;
    return MotionComponent;
  };

  const motion = (Component: any) => {
    return React.forwardRef((props: any, ref: any) => {
      const { variants, initial, animate, whileHover, ...rest } = props;
      return React.createElement(Component, { ref, ...rest }, props.children);
    });
  };

  // Add static properties to motion function
  Object.assign(motion, {
    div: createMotionComponent('div'),
    table: createMotionComponent('table'),
    tr: createMotionComponent('tr'),
    span: createMotionComponent('span')
  });

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children
  };
});