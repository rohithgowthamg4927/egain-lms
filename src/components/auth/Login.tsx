
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/lib/types';
import LoginForm from './LoginForm';
import { useToast } from '@/hooks/use-toast';

interface LoginProps {
  onAuthenticated: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onAuthenticated }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle successful login
  const handleLoginSuccess = (user: User) => {
    onAuthenticated(user);
    toast({
      title: 'Login Successful',
      description: `Welcome back, ${user.fullName}!`,
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
