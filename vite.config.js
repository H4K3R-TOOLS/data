import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.R2_ACCOUNT_ID': JSON.stringify(env.R2_ACCOUNT_ID || env.VITE_R2_ACCOUNT_ID || ''),
      'process.env.R2_ACCESS_KEY_ID': JSON.stringify(env.R2_ACCESS_KEY_ID || env.VITE_R2_ACCESS_KEY_ID || ''),
      'process.env.R2_SECRET_ACCESS_KEY': JSON.stringify(env.R2_SECRET_ACCESS_KEY || env.VITE_R2_SECRET_ACCESS_KEY || ''),
      'process.env.R2_BUCKET_NAME': JSON.stringify(env.R2_BUCKET_NAME || env.VITE_R2_BUCKET_NAME || ''),
      'process.env.R2_PUBLIC_URL': JSON.stringify(env.R2_PUBLIC_URL || env.VITE_R2_PUBLIC_URL || ''),
    },
  };
});
