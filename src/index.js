// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/layout.css';
import './styles/components/button.css';
import './styles/components/card.css';
import './styles/components/toast.css';
import './styles/pages/dashboard.css';
import './styles/pages/students.css';
import './styles/pages/attendance.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);