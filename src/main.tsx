
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import setupDatabase from './lib/setup-database.ts'

// Initialize the app with proper database setup
// This will only run in a Node.js environment
const isBrowser = typeof window !== 'undefined';

// Only run setupDatabase in Node.js environment
if (!isBrowser) {
  setupDatabase()
    .then(() => console.log('Database setup completed'))
    .catch(error => console.error('Error setting up database:', error));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
