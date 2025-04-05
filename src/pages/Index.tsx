
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Terminal, CheckCircle2, XCircle } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check if the backend server is running
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/auth/health');
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      }
    };
    
    checkServerStatus();
  }, []);

  // Add logging to help debug
  console.log("Index Page - Auth State:", { isAuthenticated, isLoading });

  useEffect(() => {
    // Check for existing auth on page load
    const checkExistingAuth = () => {
      const userJson = localStorage.getItem('currentUser');
      const token = localStorage.getItem('authToken');
      
      console.log("Checking existing auth:", { 
        userExists: !!userJson, 
        tokenExists: !!token,
        userData: userJson ? JSON.parse(userJson) : null
      });
      
      if (userJson && token) {
        console.log("Found existing user in storage, redirecting to dashboard");
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      }
    };
    
    checkExistingAuth();
  }, [navigate]);

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!isLoading && isAuthenticated) {
      console.log("User is authenticated, redirecting to dashboard");
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    }
  }, [isAuthenticated, isLoading, navigate]);

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
            {serverStatus === 'checking' && <AlertCircle className="h-4 w-4 mr-2" />}
            {serverStatus === 'online' && <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />}
            {serverStatus === 'offline' && <XCircle className="h-4 w-4 mr-2" />}
            <AlertTitle>Backend Server Status: {serverStatus}</AlertTitle>
            <AlertDescription className="text-sm">
              {serverStatus === 'online' ? 
                "Server is running at http://localhost:4000" : 
                "Please ensure the backend server is running at http://localhost:4000"}
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="mt-4">
          <Alert className="bg-slate-950 text-slate-50 border-slate-800">
            <Terminal className="h-4 w-4 mr-2" />
            <AlertDescription className="text-xs font-mono">
              # Run in a new terminal:<br />
              npx ts-node backend/server.js
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Default login credentials:</p>
          <p><strong>Email:</strong> admin@lms.com</p>
          <p><strong>Password:</strong> Admin@123</p>
          <p><strong>Role:</strong> admin</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
