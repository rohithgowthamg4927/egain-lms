
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '@/lib/api';
import { Role, User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      
      try {
        // Use getCurrentUser instead of fetchUsers
        const response = await getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setUser(null);
          console.error('Error loading user:', response.error);
        }
      } catch (error) {
        setUser(null);
        console.error('Error loading user', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string, role: Role) => {
    setIsLoading(true);
    
    try {
      const response = await apiLogin(email, password, role);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        
        // Redirect based on role
        switch (response.data.user.role) {
          case Role.admin:
            navigate('/dashboard');
            break;
          case Role.instructor:
            navigate('/instructor-dashboard');
            break;
          case Role.student:
            navigate('/student-dashboard');
            break;
          default:
            navigate('/dashboard');
        }
        
        toast({
          title: 'Login Successful',
          description: `Welcome, ${response.data.user.fullName}!`,
        });
        
        return true;
      } else {
        toast({
          title: 'Login Failed',
          description: response.error || 'Invalid credentials',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      toast({
        title: 'Login Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiLogout().then(() => {
      setUser(null);
      navigate('/');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    });
  };

  const hasRole = (roles: Role | Role[]) => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
