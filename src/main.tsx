
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import setupDatabase from './lib/setup-database.ts'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only run database setup in Node.js environment
if (!isBrowser) {
  // Initialize the database
  setupDatabase()
    .then(() => console.log('Database setup completed'))
    .catch(error => console.error('Error setting up database:', error));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
