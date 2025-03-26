
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { fetchUsers, login as apiLogin, logout as apiLogout } from '@/lib/api';
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
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      
      try {
        // Check if there's a user session in localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
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
      console.log("Attempting login with:", { email, role });
      
      // Call the API login function
      const response = await apiLogin(email, password, role);
      
      if (response.success && response.data) {
        const userData = response.data.user;
        setUser(userData);
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Redirect based on role
        switch (userData.role) {
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
          description: `Welcome, ${userData.fullName}!`,
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
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Remove user from localStorage
    localStorage.removeItem('currentUser');
    setUser(null);
    navigate('/');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
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
