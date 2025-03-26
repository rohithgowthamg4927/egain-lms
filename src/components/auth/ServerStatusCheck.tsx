
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const ServerStatusCheck = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/health`, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (error) {
        console.error('Server check error:', error);
        setStatus('offline');
      }
    };

    checkServerStatus();
    
    // Check server status every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="flex items-center justify-center space-x-2 text-sm">
      {status === 'checking' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          <span className="text-gray-500">Checking server status...</span>
        </>
      )}
      
      {status === 'online' && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Server is online</span>
        </>
      )}
      
      {status === 'offline' && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-600">Server is offline - Please start your backend server</span>
        </>
      )}
    </div>
  );
};

export default ServerStatusCheck;
