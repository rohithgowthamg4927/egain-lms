
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const { isAuthenticated } = useAuth();
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  // Check server connectivity
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
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

  console.log("Login page - Auth state:", { isAuthenticated });

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
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
          
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {serverError}. Make sure the backend server is running at http://localhost:3001.
              </AlertDescription>
            </Alert>
          )}

          <LoginForm />
          
          <div className="mt-4 text-xs text-center text-white/70">
            <p>Default login credentials:</p>
            <p>Email: admin@lms.com</p>
            <p>Password: Admin@123</p>
            <p>Role: admin</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
