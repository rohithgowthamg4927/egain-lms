
import { useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface ServerStatusCheckProps {
  children?: ReactNode;
  onComplete?: () => void;
}

const ServerStatusCheck = ({ children, onComplete }: ServerStatusCheckProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isServerUp, setIsServerUp] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsServerUp(true);
        setIsChecking(false);
        if (onComplete) onComplete();
      } else {
        throw new Error('Server is not healthy');
      }
    } catch (error) {
      console.error('Server check failed:', error);
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(checkServerStatus, 2000); // Retry after 2 seconds
      } else {
        setIsChecking(false);
        toast({
          title: 'Server Connection Failed',
          description: 'Could not connect to the server. Please try again later.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRetry = () => {
    setIsChecking(true);
    setRetryCount(0);
    checkServerStatus();
  };

  useEffect(() => {
    checkServerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isChecking) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium">Connecting to server...</h3>
          <p className="text-sm text-muted-foreground">
            Attempt {retryCount + 1} of {maxRetries + 1}
          </p>
        </div>
        {children || <div className="mt-4">Please wait while we establish connection...</div>}
      </div>
    );
  }

  if (!isServerUp) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium">Server Unavailable</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We couldn't connect to the backend server. This might be because it's not running or there's a network issue.
          </p>
        </div>
        <Button onClick={handleRetry}>Try Again</Button>
      </div>
    );
  }

  // If server is up, render the app
  return (
    <>
      {children || (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium">Server is connected!</h3>
        </div>
      )}
    </>
  );
};

export default ServerStatusCheck;
