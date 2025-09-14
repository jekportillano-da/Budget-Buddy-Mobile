# Build and Deployment Guide

This guide covers building and deploying Budget Buddy Mobile using EAS Build.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [EAS Build Setup](#eas-build-setup)
- [Build Profiles](#build-profiles)
- [Building for Android](#building-for-android)
- [Building for iOS](#building-for-ios)
- [Distribution](#distribution)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- **EAS CLI**: `npm install -g eas-cli`
- **Expo CLI**: `npm install -g @expo/cli`
- **Node.js**: Version 18 or higher
- **Git**: For version control

### EAS Account Setup
1. Create an Expo account at [expo.dev](https://expo.dev)
2. Login via CLI: `eas login`
3. Configure project: `eas build:configure`

## EAS Build Setup

### Initial Configuration

The project includes pre-configured EAS build settings in `eas.json`:

```json
{
  "cli": {
    "version": ">= 16.18.1",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleRelease",
        "buildType": "apk"
      },
      "env": {
        "NODE_ENV": "production",
        "EXPO_NO_CAPABILITY_SYNC": "1"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "gradleCommand": ":app:assembleRelease",
        "buildType": "apk"
      },
      "env": {
        "NODE_ENV": "production",
        "EXPO_NO_CAPABILITY_SYNC": "1"
      }
    }
  }
}
```

## Build Profiles

### Development Profile
- **Purpose**: Development and debugging
- **Client**: Development client with debugging tools
- **Distribution**: Internal only
- **Usage**: `eas build --profile development`

### Preview Profile  
- **Purpose**: Testing and QA
- **Output**: APK/IPA files for manual distribution
- **Distribution**: Internal sharing
- **Usage**: `eas build --profile preview`

### Production Profile
- **Purpose**: App store releases
- **Output**: Production-ready builds
- **Distribution**: App stores (Google Play, Apple App Store)
- **Usage**: `eas build --profile production`

## Building for Android

### Prerequisites for Android
- **Android credentials** will be managed by EAS
- **Keystore** will be generated automatically if not provided

### Build Commands

```bash
# Development build
eas build --platform android --profile development

# Preview build (recommended for testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production

# All platforms (when iOS is added)
eas build --platform all --profile preview
```

### Android-Specific Configuration

The Android build includes specific configurations to resolve common issues:

```json
"android": {
  "gradleCommand": ":app:assembleRelease",
  "buildType": "apk"
}
```

### Environment Variables for Android
- `NODE_ENV=production` - Ensures production optimizations
- `EXPO_NO_CAPABILITY_SYNC=1` - Prevents capability sync issues

## Building for iOS (Future)

### Prerequisites for iOS
- **Apple Developer Account** (required)
- **iOS Distribution Certificate**
- **Provisioning Profiles**
- **macOS** for local iOS development

### iOS Build Commands (When Implemented)
```bash
# iOS preview build
eas build --platform ios --profile preview

# iOS production build  
eas build --platform ios --profile production
```

## Distribution

### Internal Distribution (Current)

**Preview builds** generate downloadable APK files:

1. **Build completes** - EAS provides download link
2. **Download APK** - Save to your device/computer
3. **Install manually** - Sideload on Android devices
4. **Share link** - Send to testers via the EAS link

### Future Distribution Methods

**Google Play Store** (Phase 3):
- Use `production` profile
- Configure `eas submit` for automated submission
- Set up Play Console integration

**Apple App Store** (Phase 3):
- Use `production` profile for iOS
- Configure App Store Connect integration
- Set up iOS provisioning and certificates

## Build Monitoring

### Viewing Build Status
```bash
# List recent builds
eas build:list

# View specific build details
eas build:view [BUILD_ID]

# Cancel running build
eas build:cancel [BUILD_ID]
```

### Build Logs
- **Real-time logs** available during build process
- **Complete logs** accessible via EAS dashboard
- **Download logs** for troubleshooting

## Troubleshooting

### Common Android Build Issues

#### Gradle Path Errors
```
Error: path may not be null or empty string
```
**Solution**: Ensure `gradleCommand` and `buildType` are specified in build profile.

#### Missing Dependencies
```
Plugin [id: 'expo-module-gradle-plugin'] was not found
```
**Solution**: Run `npm install` to ensure all dependencies are installed.

#### Capability Sync Errors
```
Could not get unknown property 'release'
```
**Solution**: Add `EXPO_NO_CAPABILITY_SYNC=1` to environment variables.

### Build Performance Optimization

#### Reduce Build Time
- **Use preview profile** for testing (faster than production)
- **Cache dependencies** - EAS automatically caches when possible
- **Parallel builds** - Build different platforms separately

#### Resource Management
- **Monitor build queue** - Check EAS dashboard for queue status
- **Build limits** - Be aware of monthly build quotas
- **Optimize bundle size** - Remove unused dependencies

### Local Development vs EAS Build

#### Local Development (Faster Iteration)
```bash
# Start development server
npx expo start

# Run on Android emulator
npx expo run:android

# Run on iOS simulator (macOS only)
npx expo run:ios
```

#### EAS Build (Production Testing)
- **Use for final testing** before release
- **Test on actual devices** with production configuration
- **Validate app store compatibility**

## Build History and Versioning

### Version Management
- **Automatic increment** enabled for production builds
- **Manual versioning** in `app.json` for development
- **Tag releases** in Git to match build versions

### Build Artifacts
- **APK files** stored on EAS servers
- **Download links** remain active for extended periods
- **Build metadata** includes commit hash and configuration details

## Security Considerations

### Credentials Management
- **EAS manages credentials** securely in the cloud
- **Local credentials** not required for most setups
- **Keystore security** handled by EAS infrastructure

### Environment Variables
- **Sensitive data** should use EAS Secrets
- **Public variables** can be in `eas.json`
- **Never commit** API keys or secrets to version control

## Next Steps

1. **Set up iOS builds** when iOS support is added in Phase 3
2. **Configure app store submission** using `eas submit`
3. **Implement CI/CD** with GitHub Actions and EAS
4. **Add automated testing** before builds
5. **Set up staging environments** for better testing workflows

---

*This guide will be updated as new build features and platforms are added to the project.*
