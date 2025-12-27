# Get-Noticed Mobile Deployment Guide

This guide explains how to deploy Get-Noticed as a website, PWA, and native iOS/Android apps.

## Platform Options

### 1. Website (Already Running)
Your Get-Noticed website works immediately on all devices with a web browser.

### 2. Progressive Web App (PWA)
PWA support is already configured! Users can install Get-Noticed from their browser:
- **iOS**: Open in Safari → Share → "Add to Home Screen"
- **Android**: Chrome will show an "Install" prompt automatically

PWA Benefits:
- Installable without app store
- Works offline for cached content
- Receives push notifications (when implemented)
- No app store fees

### 3. Native iOS App (Requires Apple Developer Account - $99/year)

#### Prerequisites
- Mac computer with Xcode installed
- Apple Developer account ($99/year)
- Node.js and npm installed

#### Build Steps
```bash
cd frontend

# Build the web app
npm run build

# Add iOS platform (one-time)
npm run cap:add:ios

# Sync and build
npm run build:ios

# Open in Xcode
npm run cap:open:ios
```

In Xcode:
1. Select your Apple Developer team in Signing & Capabilities
2. Set the Bundle Identifier (com.get-noticed.app)
3. Build and run on simulator or device
4. Archive for App Store submission

### 4. Native Android App (Requires Google Play Console - $25 one-time)

#### Prerequisites
- Android Studio installed
- Google Play Developer account ($25 one-time)
- Java JDK installed

#### Build Steps
```bash
cd frontend

# Build the web app
npm run build

# Add Android platform (one-time)
npm run cap:add:android

# Sync and build
npm run build:android

# Open in Android Studio
npm run cap:open:android
```

In Android Studio:
1. Let Gradle sync complete
2. Build and run on emulator or device
3. Generate signed APK/AAB for Play Store

## Development Workflow

### Running on Mobile Devices During Development

1. Start your development server:
```bash
npm start
```

2. Edit `capacitor.config.ts` and uncomment the server URL:
```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:3001',  // e.g., 192.168.1.100
  cleartext: true,
}
```

3. Sync and run:
```bash
npm run cap:sync
npm run cap:open:ios  # or cap:open:android
```

### After Making Web Changes
```bash
npm run build:mobile  # Builds web and syncs to both platforms
```

## App Icons and Splash Screens

### Current Setup
SVG icons are provided in `public/icons/`. For app store submission, you'll need PNG icons.

### Generating PNG Icons
Use a tool like:
- [PWABuilder ImageGenerator](https://www.pwabuilder.com/imageGenerator)
- [App Icon Generator](https://appicon.co/)

Required sizes for iOS: 20, 29, 40, 60, 76, 83.5, 1024 (points @1x, @2x, @3x)
Required sizes for Android: mdpi (48), hdpi (72), xhdpi (96), xxhdpi (144), xxxhdpi (192)

### Splash Screens
Capacitor auto-generates splash screens from a single image. Add your splash image to:
- iOS: `ios/App/App/Assets.xcassets/Splash.imageset/`
- Android: `android/app/src/main/res/drawable/splash.png`

## Configuration Files

### capacitor.config.ts
Main configuration for native apps:
- App ID: `com.get-noticed.app`
- App Name: `Get-Noticed`
- Web directory: `build`

### manifest.json
PWA configuration for installable web app.

## Deep Linking

Configure deep links to open your app from URLs:
- iOS: Configure in Xcode under Signing & Capabilities → Associated Domains
- Android: Configure in `android/app/src/main/AndroidManifest.xml`

URL scheme: `get-noticed://`
Universal links: `https://get-noticed.app/*`

## Push Notifications (Future Enhancement)

To add push notifications:
```bash
npm install @capacitor/push-notifications
```

Requires:
- iOS: Apple Push Notification service (APNs) certificate
- Android: Firebase Cloud Messaging (FCM) setup

## Helpful Commands

```bash
# Build for all platforms
npm run build:mobile

# Sync only iOS
npm run build:ios

# Sync only Android
npm run build:android

# Open iOS project
npm run cap:open:ios

# Open Android project
npm run cap:open:android

# Live reload development
npx cap run ios --livereload --external
npx cap run android --livereload --external
```

## Troubleshooting

### iOS Build Errors
- Ensure Xcode Command Line Tools are installed: `xcode-select --install`
- Clean build folder in Xcode: Product → Clean Build Folder

### Android Build Errors
- Ensure Android SDK is properly installed
- Check `local.properties` has correct SDK path
- Try: Build → Clean Project, then Build → Rebuild Project

### Capacitor Sync Issues
```bash
npx cap sync --force
```

## App Store Submission Checklist

### iOS App Store
- [ ] Apple Developer account active
- [ ] App icons (all sizes)
- [ ] Launch screen / splash screen
- [ ] Screenshots (6.5", 5.5" iPhones, iPad Pro)
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] App review notes
- [ ] Build uploaded via Xcode

### Google Play Store
- [ ] Google Play Developer account active
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone and tablet)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Signed AAB/APK uploaded
