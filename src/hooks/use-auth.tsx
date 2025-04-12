
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

  // Clear potentially corrupted auth data
  const clearAuthData = () => {
    console.log('Clearing auth data due to corruption or invalid state');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      
      try {
        const storedUser = localStorage.getItem('currentUser');
        const authToken = localStorage.getItem('authToken');
        
        console.log('Loading stored user data:', { 
          hasStoredUser: !!storedUser, 
          hasAuthToken: !!authToken 
        });

        if (!storedUser || !authToken) {
          console.log('No complete auth data found');
          clearAuthData();
          return;
        }

        try {
          const userData = JSON.parse(storedUser);
          if (!userData || typeof userData !== 'object') {
            console.error('Invalid user data format');
            clearAuthData();
            return;
          }
          setUser(userData);
          console.log('Successfully loaded user data');
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
          clearAuthData();
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        clearAuthData();
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
      
      if (response.success && response.data && response.data.user) {
        const userData = response.data.user;
        console.log("Login successful, user data:", userData);
        
        try {
          // Validate user data before storing
          if (!userData || typeof userData !== 'object') {
            throw new Error('Invalid user data received from server');
          }
          
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
          
          // Navigate to appropriate dashboard based on role
          if (userData.role === Role.student) {
            navigate('/student/dashboard', { replace: true });
          } else if (userData.role === Role.instructor) {
            navigate('/instructor/dashboard', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
          
          return true;
        } catch (storageError) {
          console.error('Failed to store auth data:', storageError);
          clearAuthData();
          toast({
            title: 'Login Error',
            description: 'Failed to save login information',
            variant: 'destructive',
          });
          return false;
        }
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
    clearAuthData();
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
