import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// import './index.css'; // optional: uncomment if your project has this file

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found: ensure index.html contains <div id="root"></div>');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
