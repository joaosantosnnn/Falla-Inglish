import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.falla.app',
  appName: 'FALLA',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
