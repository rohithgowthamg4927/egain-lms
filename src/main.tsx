import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/hooks/use-auth'
import ErrorBoundary from '@/components/ErrorBoundary'

// Add global error handler
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
  return false;
};

// Add unhandled promise rejection handler
window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
};

console.log("==== STARTING APPLICATION ====");
console.log("Environment:", import.meta.env.MODE);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Log important app startup information
console.log("Rendering React application...");
console.log("API URL:", "http://localhost:3001/api");

// Check for existing authentication
const existingToken = localStorage.getItem('authToken');
const existingUser = localStorage.getItem('currentUser');
console.log("Initial auth state:", { 
  hasToken: !!existingToken, 
  hasUser: !!existingUser 
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="lms-theme">
            <AuthProvider>
              <App />
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

// Log when the app has finished rendering
console.log("==== APPLICATION RENDERED ====");
