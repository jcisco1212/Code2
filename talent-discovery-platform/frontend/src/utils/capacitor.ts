/**
 * Capacitor Utilities
 * Handles platform detection and native plugin initialization
 *
 * Note: This module gracefully handles the case where Capacitor is not installed,
 * making it safe to use in web-only deployments.
 */

// Check if Capacitor is available at runtime (loaded via native shell)
const getCapacitor = (): any => {
  return (window as any).Capacitor;
};

// Check if running on native platform
export const isNativePlatform = (): boolean => {
  const Capacitor = getCapacitor();
  if (!Capacitor) return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// Get current platform
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  const Capacitor = getCapacitor();
  if (!Capacitor) return 'web';
  try {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  } catch {
    return 'web';
  }
};

// Check if a plugin is available
export const isPluginAvailable = (pluginName: string): boolean => {
  const Capacitor = getCapacitor();
  if (!Capacitor) return false;
  try {
    return Capacitor.isPluginAvailable(pluginName);
  } catch {
    return false;
  }
};

// Initialize Capacitor plugins for native platforms
export const initializeCapacitor = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    const Capacitor = getCapacitor();
    const Plugins = Capacitor?.Plugins;

    if (!Plugins) return;

    // Hide splash screen
    if (Plugins.SplashScreen) {
      await Plugins.SplashScreen.hide();
    }

    // Set status bar style
    if (Plugins.StatusBar) {
      await Plugins.StatusBar.setStyle({ style: 'LIGHT' });
      if (getPlatform() === 'android') {
        await Plugins.StatusBar.setBackgroundColor({ color: '#667eea' });
      }
    }

    // Handle keyboard events on iOS
    if (getPlatform() === 'ios' && Plugins.Keyboard) {
      Plugins.Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-visible');
      });
      Plugins.Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-visible');
      });
    }

    // Handle app state changes
    if (Plugins.App) {
      Plugins.App.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        console.log('App state changed. Is active?', isActive);
      });

      // Handle back button on Android
      Plugins.App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          Plugins.App.exitApp();
        }
      });

      // Handle deep links
      Plugins.App.addListener('appUrlOpen', ({ url }: { url: string }) => {
        console.log('Deep link opened:', url);
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
  const Capacitor = getCapacitor();
  const Plugins = Capacitor?.Plugins;

  if (Plugins?.Share) {
    try {
      await Plugins.Share.share(options);
      return;
    } catch {
      // Fall through to web fallback
    }
  }

  // Fallback to Web Share API
  if (navigator.share) {
    await navigator.share(options);
  } else {
    // Copy to clipboard as final fallback
    const text = options.url || options.text || '';
    await navigator.clipboard.writeText(text);
  }
};

// Trigger haptic feedback
export const triggerHaptic = async (
  type: 'light' | 'medium' | 'heavy' = 'medium'
): Promise<void> => {
  const Capacitor = getCapacitor();
  const Plugins = Capacitor?.Plugins;

  if (!Plugins?.Haptics) {
    return;
  }

  try {
    const styleMap = {
      light: 'LIGHT',
      medium: 'MEDIUM',
      heavy: 'HEAVY'
    };
    await Plugins.Haptics.impact({ style: styleMap[type] });
  } catch {
    // Haptics not available
  }
};
