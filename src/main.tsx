import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './AppRouter';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import '@patternfly/react-core/dist/styles/base.css';
import './index.css';

async function enablePreviewMode() {
  if (!import.meta.env.VITE_PREVIEW_MODE) return;

  sessionStorage.setItem('jwt_token', 'mock-preview-jwt-token');
  sessionStorage.setItem('user_id', 'admin@preview.local');
  sessionStorage.setItem('role', 'admin');
  sessionStorage.setItem('name', 'Preview');
  sessionStorage.setItem('surname', 'User');
  sessionStorage.setItem('organization', 'Krkn');
  sessionStorage.setItem(
    'jwt_expiry',
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  );

  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}

enablePreviewMode().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/+$/, '')}>
        <AuthProvider>
          <AppProvider>
            <AppRouter />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
});
