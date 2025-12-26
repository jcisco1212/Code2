import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
// This enables offline support and installability
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Notify user that a new version is available
    if (registration.waiting) {
      console.log('New version available! Refresh to update.');
    }
  },
  onSuccess: () => {
    console.log('TalentVault is ready for offline use.');
  }
});
