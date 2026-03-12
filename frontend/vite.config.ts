import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const target = env.VITE_API_URL;

  const wsTarget = env.VITE_WS_URL;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/auth': {
          target: target,
          changeOrigin: true,
        },
        '/socket.io': {
          target: wsTarget,
          ws: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
  };
});