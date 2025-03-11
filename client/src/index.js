import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hvis du ønsker å måle ytelse i appen din, pass på reportWebVitals
// til en analysefunksjon: https://bit.ly/CRA-vitals
reportWebVitals(); 