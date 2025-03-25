
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { UserForm } from '@/components/users/UserForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/lib/types';
import { UserPlus } from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  bio?: string;
  phone?: string;
  photoUrl?: string;
}

const AddUser = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // In a real app, you would make an API call to create the user
      console.log('Creating user:', data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'User created successfully',
        description: `${data.fullName} has been added as ${data.role.toLowerCase()}`,
      });
      
      // Redirect to the appropriate page based on the user role
      switch (data.role) {
        case Role.INSTRUCTOR:
          navigate('/instructors');
          break;
        case Role.STUDENT:
          navigate('/students');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error creating user',
        description: 'There was an error creating the user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add New User</h1>
            <p className="text-muted-foreground mt-1">Create a new admin, instructor, or student account</p>
          </div>
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        
        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Enter the details for the new user. All users will receive an email to set their password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddUser;
