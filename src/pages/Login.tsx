import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  // Check server connectivity
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (!response.ok) {
          setServerError('Backend server is not responding properly');
        }
      } catch (error) {
        setServerError('Cannot connect to backend server');
      } finally {
        setIsCheckingServer(false);
      }
    };
    
    checkServerStatus();
  }, []);


  // Check localStorage directly as a fallback
  const hasStoredToken = !!localStorage.getItem('authToken');
  const hasStoredUser = !!localStorage.getItem('currentUser');

  // If already authenticated, redirect to dashboard
  if (isAuthenticated || (hasStoredToken && hasStoredUser)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800">
      {isCheckingServer ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <p className="text-sm text-white">Checking server status...</p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="text-center mb-6 text-white">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-white/80">
              Sign in to your account to continue
            </p>
          </div>
          
          

          <LoginForm />
        </div>
      )}
    </div>
  );
};

export default Login;
