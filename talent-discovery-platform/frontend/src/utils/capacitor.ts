/**
 * Capacitor Utilities
 * Handles platform detection and native plugin initialization
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

// Check if running on native platform
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Get current platform
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

// Check if a plugin is available
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};

// Initialize Capacitor plugins for native platforms
export const initializeCapacitor = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    // Hide splash screen after app is ready
    await SplashScreen.hide();

    // Set status bar style
    if (isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Light });
      if (getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#667eea' });
      }
    }

    // Handle keyboard events on iOS
    if (getPlatform() === 'ios' && isPluginAvailable('Keyboard')) {
      Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-visible');
      });
      Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-visible');
      });
    }

    // Handle app state changes
    if (isPluginAvailable('App')) {
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      // Handle back button on Android
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });

      // Handle deep links
      App.addListener('appUrlOpen', ({ url }) => {
        console.log('Deep link opened:', url);
        // Handle deep link navigation here
        const path = new URL(url).pathname;
        if (path) {
          window.location.href = path;
        }
      });
    }
  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
};

// Share content using native share sheet
export const shareContent = async (options: {
  title: string;
  text?: string;
  url?: string;
}): Promise<void> => {
  if (isPluginAvailable('Share')) {
    const { Share } = await import('@capacitor/share');
    await Share.share(options);
  } else {
    // Fallback to Web Share API
    if (navigator.share) {
      await navigator.share(options);
    } else {
      // Copy to clipboard as final fallback
      const text = options.url || options.text || '';
      await navigator.clipboard.writeText(text);
    }
  }
};

// Trigger haptic feedback
export const triggerHaptic = async (
  type: 'light' | 'medium' | 'heavy' = 'medium'
): Promise<void> => {
  if (isPluginAvailable('Haptics')) {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    };
    await Haptics.impact({ style: styleMap[type] });
  }
};
