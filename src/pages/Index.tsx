
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/LoginForm';

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      // Redirect based on role
      switch (user.role) {
        case 'ADMIN':
          navigate('/dashboard');
          break;
        case 'INSTRUCTOR':
          navigate('/instructor-dashboard');
          break;
        case 'STUDENT':
          navigate('/student-dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col md:flex-row">
      {/* Left side with illustration */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <img 
          src="public/lovable-uploads/96792f8f-d134-49c6-9d72-9e80cb1dbcb6.png" 
          alt="Learning illustration" 
          className="max-w-full max-h-[80vh] object-contain"
        />
      </div>
      
      {/* Right side with login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Index;
