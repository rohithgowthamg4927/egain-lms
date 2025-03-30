
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Database, Loader2, Server } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const ServerStatusCheck = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dbStatus, setDbStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const checkServerStatus = async () => {
    try {
      setIsRetrying(true);
      console.log(`Checking server status at: ${apiUrl}/api/health`);
      
      const response = await fetch(`${apiUrl}/api/health`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Server is online, response:', data);
        setStatus('online');
        setDbStatus(data.status === 'ok' ? 'connected' : 'error');
        setErrorDetails(null);
        toast({
          title: "Connected to backend",
          description: "The backend server is running properly",
          variant: "default",
        });
      } else {
        console.log('Server returned non-OK response:', response.status);
        setStatus('offline');
        setDbStatus('error');
        setErrorDetails(`Server responded with status: ${response.status}`);
        toast({
          title: "Backend connection issue",
          description: "Could not connect to the backend server. Please ensure it's running at http://localhost:3001",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Server check error:', error);
      setStatus('offline');
      setDbStatus('error');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: "Backend connection failed",
        description: "Could not connect to the backend server. Please ensure it's running at http://localhost:3001",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    
    // Check server status every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="flex flex-col items-center justify-center space-y-2 text-sm">
      {status === 'checking' && (
        <>
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500 mr-2" />
            <span className="text-gray-500">Checking server status...</span>
          </div>
        </>
      )}
      
      {status === 'online' && (
        <>
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-green-600">Server is online</span>
          </div>
          <div className="flex items-center">
            <Database className="h-4 w-4 mr-2 text-indigo-500" />
            <span className={dbStatus === 'connected' ? 'text-green-600' : 'text-amber-500'}>
              Database is {dbStatus === 'connected' ? 'connected' : 'not verified'}
            </span>
          </div>
        </>
      )}
      
      {status === 'offline' && (
        <>
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-600">Server is offline</span>
          </div>
          {errorDetails && (
            <div className="text-xs text-gray-500 max-w-xs text-center">
              Error: {errorDetails}
            </div>
          )}
          <div className="text-xs mt-1 bg-slate-100 p-2 rounded-md dark:bg-slate-800">
            <p>Please start your backend server:</p>
            <code className="font-mono text-xs block mt-1">npx ts-node backend/server.ts</code>
            <p className="mt-1">Then set up the database:</p>
            <code className="font-mono text-xs block mt-1">npx ts-node backend/setup-database.ts</code>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={checkServerStatus}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Retrying...
              </>
            ) : 'Retry Connection'}
          </Button>
        </>
      )}
    </div>
  );
};

export default ServerStatusCheck;
