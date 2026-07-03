import { AppRoot } from '@/components/app-root';
import { ClientStateProvider } from '@/lib/client-state';
import '../../styles/globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ClientStateProvider>
        <AppRoot surface="sidepanel" />
      </ClientStateProvider>
    </StrictMode>,
  );
}
