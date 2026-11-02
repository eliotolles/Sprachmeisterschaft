import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { RouterProvider } from '@/lib/router';
import App from '@/App';
import {initializeElioAuthentication} from '@/lib/db';
import '@/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function renderApplication(){
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              borderRadius: 'calc(var(--radius) - 1px)',
            },
          }}
        />
      </RouterProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

}
initializeElioAuthentication().catch(()=>{}).finally(renderApplication);
