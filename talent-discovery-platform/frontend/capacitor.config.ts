import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talentvault.app',
  appName: 'TalentVault',
  webDir: 'build',
  bundledWebRuntime: false,

  // Server configuration for development
  server: {
    // For development, you can enable this to connect to local dev server
    // url: 'http://localhost:3001',
    // cleartext: true,
    androidScheme: 'https'
  },

  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    scheme: 'TalentVault'
  },

  // Android specific configuration
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: true
  },

  // Plugin configurations
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#667eea',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      backgroundColor: '#667eea',
      style: 'LIGHT'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    App: {
      deepLinks: {
        hosts: ['talentvault.app', '*.talentvault.app'],
        schemes: ['talentvault']
      }
    }
  }
};

export default config;
