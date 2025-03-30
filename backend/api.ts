
// This file is now just a wrapper to maintain backward compatibility
// New code should import from server.ts directly

import './server';

// This file exists just to maintain compatibility with existing scripts
// All functionality has been moved to server.ts
console.log('API server started via compatibility layer. Consider updating scripts to use server.ts directly.');
