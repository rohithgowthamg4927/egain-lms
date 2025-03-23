
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import LoginForm from '@/components/auth/LoginForm';
import { BookOpen } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-center gap-12 md:gap-20">
        <div className="text-center md:text-left md:w-1/2 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent mb-6">
            Welcome to EduLMS
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
            Streamline course management, empower instructors, and enhance student learning with our comprehensive learning management system.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-8">
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
              <BookOpen className="h-10 w-10 text-primary" />
              <div className="text-left">
                <p className="font-medium">Comprehensive Course Management</p>
                <p className="text-sm text-muted-foreground">Organize and deliver your courses effectively</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
              <Users className="h-10 w-10 text-primary" />
              <div className="text-left">
                <p className="font-medium">Student Progress Tracking</p>
                <p className="text-sm text-muted-foreground">Monitor engagement and performance</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-auto animate-slide-in animation-delay-200">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

// Support component for the login page
const Users = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
};

export default Index;
