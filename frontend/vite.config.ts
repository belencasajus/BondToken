import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      
      '/uploadPDF': 'http://localhost:3000',
      '/bonds':     'http://localhost:3000',
      '/balances':  'http://localhost:3000',
      '/trades':    'http://localhost:3000',
      '/approvals': 'http://localhost:3000',
      '/payments':  'http://localhost:3000',
    }
  }
});
