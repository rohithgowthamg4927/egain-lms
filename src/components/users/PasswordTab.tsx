import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Role } from '@/lib/types';
import { Copy, Check, Download } from 'lucide-react';
import { downloadCredentialsCSV } from '@/lib/utils';
import PasswordChangeForm from './PasswordChangeForm';

interface PasswordTabProps {
  user: User;
  onUpdate?: () => void;
}

const PasswordTab = ({ user, onUpdate }: PasswordTabProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const isAdmin = user.role === Role.admin;

  const handleCopyPassword = () => {
    if (user.password) {
      navigator.clipboard.writeText(user.password);
      setCopied(true);
      
      toast({
        title: 'Success',
        description: 'Password copied to clipboard'
      });
      
      // Reset copy state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangeForm(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Current Password</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted rounded-md font-mono text-base">
              {user.password}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPassword}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => downloadCredentialsCSV(user.email, user.password || '', user.fullName)}
              className="flex-shrink-0 text-blue-500 hover:text-blue-600 hover:border-blue-600"
              title="Download Credentials"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isAdmin 
              ? "You can change your password using the button below."
              : "To regenerate the password, click the Edit button in the top-right corner of the page."}
            You can also download the credentials as a CSV file.
          </p>
        </div>

        {isAdmin && (
          <>
            {showChangeForm ? (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-4">Change Password</h3>
                <PasswordChangeForm 
                  userId={user.userId} 
                  onSuccess={handlePasswordChangeSuccess} 
                />
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setShowChangeForm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setShowChangeForm(true)}
              >
                Change Password
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordTab;
