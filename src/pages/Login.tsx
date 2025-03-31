
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/LoginForm';
import ServerStatusCheck from '@/components/auth/ServerStatusCheck';

const Login = () => {
  const { isAuthenticated } = useAuth();
  const [isCheckingServer, setIsCheckingServer] = useState(true);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      {isCheckingServer ? (
        <ServerStatusCheck onComplete={() => setIsCheckingServer(false)} />
      ) : (
        <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
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
