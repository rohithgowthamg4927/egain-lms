import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Check if the backend server is running
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://13.203.91.192:3001/api/health');
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      } finally {
        setIsPageLoading(false);
      }
    };
    
    checkServerStatus();
  }, []);

  useEffect(() => {
    // If user is authenticated and not loading, redirect to dashboard
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Show loading state while checking auth and server status
  if (authLoading || isPageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-gray-600">Loading application...</p>
        {authLoading && <p className="text-sm text-gray-500">Checking authentication...</p>}
        {isPageLoading && <p className="text-sm text-gray-500">Checking server status...</p>}
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Learning Management System</h1>
          <p className="text-gray-600 mt-2">Sign in to access your courses and resources</p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6">
          <Alert variant={serverStatus === 'online' ? 'default' : 'destructive'} className="text-center">
            <div className="flex items-center justify-center gap-2">
              {serverStatus === 'checking' && <AlertCircle className="h-4 w-4" />}
              {serverStatus === 'online' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {serverStatus === 'offline' && <XCircle className="h-4 w-4" />}
              <AlertTitle>Backend Server Status: {serverStatus}</AlertTitle>
            </div>
            <AlertDescription className="text-sm mt-2">
              {serverStatus === 'online' ? 
                "Server is running at http://localhost:3001" : 
                "Please ensure the backend server is running at http://localhost:3001"}
            </AlertDescription>
          </Alert>
        </div>
        
        {/* {serverStatus === 'offline' && (
          <div className="mt-4">
            <Alert className="bg-slate-950 text-slate-50 border-slate-800">
              <Terminal className="h-4 w-4 mr-2" />
              <AlertDescription className="text-xs font-mono">
                # Run in a new terminal:<br />
                npx ts-node backend/server.js
              </AlertDescription>
            </Alert>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Index;
