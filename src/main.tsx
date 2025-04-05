
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/hooks/use-auth'

console.log("==== STARTING APPLICATION ====");
console.log("Environment:", import.meta.env.MODE);

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Add more console logging
      onError: (error) => {
        console.error("Query error:", error);
      }
    },
  },
});

// Log important app startup information
console.log("Rendering React application...");
console.log("API URL:", "http://localhost:4000/api");

// Check for existing authentication
const existingToken = localStorage.getItem('authToken');
const existingUser = localStorage.getItem('currentUser');
console.log("Initial auth state:", { 
  hasToken: !!existingToken, 
  hasUser: !!existingUser 
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
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
  </React.StrictMode>,
)

// Log when the app has finished rendering
console.log("==== APPLICATION RENDERED ====");
