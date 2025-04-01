
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/LoginForm';
import ServerStatusCheck from '@/components/auth/ServerStatusCheck';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const { isAuthenticated } = useAuth();
  const [isCheckingServer, setIsCheckingServer] = useState(true);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a2236]">
      {isCheckingServer ? (
        <ServerStatusCheck onComplete={() => setIsCheckingServer(false)}>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-white/70">Checking server status...</p>
          </div>
        </ServerStatusCheck>
      ) : (
        <div className="w-full max-w-md">
          <div className="text-center mb-6 text-white">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-white/70">
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
