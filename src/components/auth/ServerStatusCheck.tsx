
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ServerStatusCheck = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        console.log(`Checking server status at: ${apiUrl}/api/health`);
        
        const response = await fetch(`${apiUrl}/api/health`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // Add cache: 'no-store' to prevent caching issues
          cache: 'no-store'
        });
        
        if (response.ok) {
          console.log('Server is online');
          setStatus('online');
          setErrorDetails(null);
          toast({
            title: "Connected to backend",
            description: "The backend server is running properly",
            variant: "default",
          });
        } else {
          console.log('Server returned non-OK response:', response.status);
          setStatus('offline');
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
        setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
        toast({
          title: "Backend connection failed",
          description: "Could not connect to the backend server. Please ensure it's running at http://localhost:3001",
          variant: "destructive",
        });
      }
    };

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
        </>
      )}
      
      {status === 'offline' && (
        <>
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-600">Server is offline - Please start your backend server</span>
          </div>
          {errorDetails && (
            <div className="text-xs text-gray-500 max-w-xs text-center">
              Error: {errorDetails}
            </div>
          )}
          <div className="text-xs mt-1 bg-slate-100 p-2 rounded-md dark:bg-slate-800">
            Make sure Express is installed by running:<br />
            <code className="text-xs">npm install express @types/express</code>
          </div>
        </>
      )}
    </div>
  );
};

export default ServerStatusCheck;
