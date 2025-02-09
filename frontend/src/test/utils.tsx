import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { createTestQueryClient } from './setup';
import { vi } from 'vitest';

const theme = createTheme();

// Mock router context
const RouterContext = React.createContext({
  navigate: vi.fn(),
  state: {
    location: {
      pathname: '/'
    }
  }
});

export function renderWithRouter(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();

  return {
    ...rtlRender(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RouterContext.Provider value={{
            navigate: vi.fn(),
            state: {
              location: {
                pathname: '/'
              }
            }
          }}>
            {ui}
          </RouterContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    ),
  };
}

// re-export everything
export * from '@testing-library/react'; 