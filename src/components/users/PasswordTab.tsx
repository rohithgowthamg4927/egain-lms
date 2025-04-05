import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateUser } from '@/lib/api/users';
import { User } from '@/lib/types';
import { generatePassword } from '@/lib/utils';

interface PasswordTabProps {
  user: User;
  onUpdate: () => void;
}

const PasswordTab = ({ user, onUpdate }: PasswordTabProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRegeneratePassword = async () => {
    try {
      setIsUpdating(true);
      const newPassword = generatePassword();
      
      const response = await updateUser(user.userId, {
        password: newPassword
      });

      if (response.success) {
        toast({
          title: 'Password Updated',
          description: 'The password has been regenerated successfully.',
        });
        onUpdate();
      } else {
        throw new Error(response.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Password</label>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-2 border rounded-md bg-muted/50">
              {user.password || 'No password set'}
            </div>
            <Button
              onClick={handleRegeneratePassword}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? 'Regenerating...' : 'Regenerate Password'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Click "Regenerate Password" to create a new password for this user.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordTab; 