
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { login as apiLogin, logout as apiLogout } from '@/lib/api';
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
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          console.log("Found stored user in localStorage");
          setUser(JSON.parse(storedUser));
        } else {
          console.log("No stored user found in localStorage");
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user from localStorage', error);
        setUser(null);
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
      
      const response = await apiLogin(email, password, role);
      console.log("Login response:", response);
      
      if (response.success && response.data) {
        const userData = response.data.user;
        console.log("Login successful, user data:", userData);
        
        // Store user in state and localStorage
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Store the token
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        
        toast({
          title: 'Login Successful',
          description: `Welcome, ${userData.fullName}!`,
        });
        
        // Force navigation to dashboard after a brief delay
        setTimeout(() => {
          console.log("Redirecting to dashboard after successful login");
          navigate('/dashboard', { replace: true });
        }, 100);
        
        return true;
      } else {
        console.error("Login failed:", response.error);
        toast({
          title: 'Login Failed',
          description: response.error || 'Invalid credentials',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      console.error("Login error:", error);
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
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/', { replace: true });
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
