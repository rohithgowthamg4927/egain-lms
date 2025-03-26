
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Role } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleLogin = async (selectedRole: Role) => {
    if (!email || !password) {
      toast({
        title: 'Missing information',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    // Use the login function from the auth context
    const success = await login(email, password, selectedRole);
    
    if (!success) {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">LMS Admin</CardTitle>
          <CardDescription className="text-center">
            Login with your admin, instructor, or student account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-around">
          <Button onClick={() => handleLogin(Role.admin)} disabled={isLoading}>Admin</Button>
          <Button onClick={() => handleLogin(Role.instructor)} disabled={isLoading}>Instructor</Button>
          <Button onClick={() => handleLogin(Role.student)} disabled={isLoading}>Student</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Index;
