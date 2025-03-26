
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import ServerStatusCheck from '@/components/auth/ServerStatusCheck';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';

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
      <div className="container flex flex-col items-center justify-center min-h-screen">
        <LoginForm />
        <div className="mt-6">
          <ServerStatusCheck />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
