import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import './index.css';
import 'swiper/swiper-bundle.css';
import 'flatpickr/dist/flatpickr.css';
import { AppWrapper } from './components/common/PageMeta.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ClientStateProvider } from './lib/client-state';
import { I18nProvider } from './lib/i18n';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClientStateProvider>
      <I18nProvider>
        <ThemeProvider>
          <AppWrapper>
            <RouterProvider router={router} />
          </AppWrapper>
        </ThemeProvider>
      </I18nProvider>
    </ClientStateProvider>
  </StrictMode>,
);
