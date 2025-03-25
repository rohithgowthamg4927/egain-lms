
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
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

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      
      try {
        // For demo purposes, just use the first user as logged in
        const users = await fetchUsers();
        if (users && users.length > 0) {
          setUser(users[0]);
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
      // For demo, just find a user with the matching email
      const users = await fetchUsers();
      const matchedUser = users.find(u => u.email === email && u.role === role);
      
      if (matchedUser && password === 'Admin@123') {
        setUser(matchedUser);
        
        // Redirect based on role
        switch (matchedUser.role) {
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
          description: `Welcome, ${matchedUser.fullName}!`,
        });
        
        return true;
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid credentials',
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
    // In a real app, you would call the API to logout
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
