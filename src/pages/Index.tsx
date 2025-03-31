
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import ServerStatusCheck from '@/components/auth/ServerStatusCheck';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Terminal } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Layout requireAuth={false}>
      <div className="container flex flex-col items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Learning Management System</CardTitle>
            <CardDescription>Log in to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            
            <div className="mt-4">
              <Alert variant="warning" className="text-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>Backend Server Required</AlertTitle>
                <AlertDescription className="text-sm">
                  Please ensure the backend server is running at http://localhost:3001
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
            
            <div className="mt-4 text-center">
              <ServerStatusCheck />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
