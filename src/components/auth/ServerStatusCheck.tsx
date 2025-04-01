
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ServerStatusCheckProps {
  children: React.ReactNode;
  onComplete?: () => void;
}

const ServerStatusCheck: React.FC<ServerStatusCheckProps> = ({ children, onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const endpoint = `${apiUrl}/health`;
        
        console.log('Checking server status at:', endpoint);
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        console.log('Server is online, response:', data);
        
        setIsOnline(true);
        setIsLoading(false);
        
        if (onComplete) {
          onComplete();
        }
      } catch (err) {
        console.error('Server is offline or unavailable:', err);
        setError('Server is offline or unavailable. Please try again later.');
        setIsOnline(false);
        setIsLoading(false);
      }
    };

    checkServerStatus();
  }, [onComplete]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Connecting to Server</h2>
        <p className="text-sm text-muted-foreground">Please wait while we check the server status...</p>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <svg className="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold">Server Unavailable</h2>
        <p className="mt-2 text-center text-muted-foreground max-w-md">
          {error || 'The server is currently offline. Please try again later or contact support.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ServerStatusCheck;
