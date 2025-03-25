
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { UserForm } from '@/components/users/UserForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/lib/types';
import { UserPlus } from 'lucide-react';

interface LocationState {
  role?: Role;
  userId?: number;
}

interface FormData {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  phoneNumber?: string;
  bio?: string;
  photoUrl?: string;
}

const AddUser = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { role, userId } = (location.state as LocationState) || {};

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
        case Role.instructor:
          navigate('/instructors');
          break;
        case Role.student:
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

  const defaultValues = role ? { role } : undefined;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{userId ? 'Edit User' : 'Add New User'}</h1>
            <p className="text-muted-foreground mt-1">
              {userId ? 'Edit user information' : 'Create a new admin, instructor, or student account'}
            </p>
          </div>
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        
        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle>{userId ? 'User Information' : 'New User Information'}</CardTitle>
            <CardDescription>
              {userId 
                ? 'Update the user\'s details below.' 
                : 'Enter the details for the new user. They will receive a generated password.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserForm 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting} 
              defaultValues={defaultValues}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddUser;
