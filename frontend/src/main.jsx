import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// --- SAFETY RESET SCRIPT ---
// This runs before React starts to clear corrupted data
try {
  const user = localStorage.getItem('user');
  if (user === "undefined" || user === undefined) {
    console.log("Cleaning corrupted user data...");
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
} catch (e) {
  localStorage.clear();
}
// ---------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);