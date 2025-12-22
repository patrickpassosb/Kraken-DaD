import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';

/**
 * Client entry point – bootstraps React strict mode and renders the App shell.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
