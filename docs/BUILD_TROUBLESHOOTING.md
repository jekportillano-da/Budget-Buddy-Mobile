# Production Build Troubleshooting Guide

## Common Build Issues & Solutions

### 1. Owner Mismatch Error
**Error**: `Owner of project identified by "extra.eas.projectId" does not match owner specified in the "owner" field`

**Solution**:
```json
// In app.json, ensure owner matches EAS project owner
{
  "expo": {
    "owner": "jekportillano", // Must match EAS account
    "extra": {
      "eas": {
        "projectId": "e17260ad-76ff-462e-9ec5-b0bc63c25696"
      }
    }
  }
}
```

### 2. Missing google-services.json
**Error**: `"google-services.json" is missing`

**Solution**: Remove reference from app.json if not using Firebase
```json
// Remove this line from android section:
"googleServicesFile": "./google-services.json"
```

### 3. React Native Worklets Plugin Error
**Error**: `Cannot find module 'react-native-worklets/plugin'`

**Solution**: Fix babel.config.js
```javascript
// Use react-native-reanimated plugin instead
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};
```

### 4. Version Code Warning
**Warning**: `android.versionCode field in app config is ignored when version source is set to remote`

**Solution**: Remove versionCode from app.json
```json
// Remove versionCode from android section
"android": {
  "package": "com.budgetbuddy.mobile",
  // "versionCode": 1, // Remove this line
  "icon": "./assets/icon.png"
}
```

### 5. SDK Compatibility Issues
**Error**: Package version incompatibility warnings

**Solution**: Update to SDK 51 compatible versions
```bash
npx expo install --check
# Select 'yes' to fix dependencies
```

## Build Profile Configuration

### Preview Build (APK for Testing)
```json
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
}
```

### Production Build (AAB for Store)
```json
"production": {
  "autoIncrement": true,
  "android": {
    "gradleCommand": ":app:bundleRelease",
    "buildType": "app-bundle"
  },
  "env": {
    "NODE_ENV": "production",
    "EXPO_NO_CAPABILITY_SYNC": "1"
  }
}
```

## Environment Variables

### Required for Builds
- `NODE_ENV=production`: Ensures production optimizations
- `EXPO_NO_CAPABILITY_SYNC=1`: Prevents capability sync issues

### App-Specific (Runtime)
- `EXPO_PUBLIC_COHERE_API_KEY`: AI service integration
- `EXPO_PUBLIC_SUPABASE_URL`: Database connection
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Database authentication

## Build Command Examples

```bash
# Preview build (APK for testing)
npx eas build --platform android --profile preview

# Production build (AAB for store)
npx eas build --platform android --profile production

# Check build status
npx eas build:list

# Download build
npx eas build:download [build-id]
```

## Common Gradle Warnings (Safe to Ignore)

1. **Deprecated API Warnings**: Expected with SDK updates
2. **Package Namespace Warnings**: Library maintenance issues
3. **Manifest Provider Warnings**: Standard Android build process

## Build Success Indicators

✅ **Successful Build Process**:
1. Project compression and upload completes
2. Gradle configuration succeeds
3. Metro bundling completes without errors
4. Android compilation finishes
5. APK/AAB generation successful

✅ **Build Artifacts**:
- APK file size reasonable (~50MB expected)
- Proper signing with release keystore
- All permissions correctly applied
- Manifest properly configured

## Testing Checklist After Successful Build

1. **Installation**: APK installs on device
2. **Launch**: App starts without crashing
3. **Core Features**: All main functionality works
4. **Performance**: Smooth operation
5. **Network**: API calls successful
6. **Storage**: Database operations work

## Next Steps After Successful Build

1. Download and test APK thoroughly
2. Fix any runtime issues found
3. Create production AAB build
4. Prepare for store submission
5. Update version numbers for next release

---

*This guide covers the most common issues encountered during Budget Buddy production builds. Keep this updated as new issues are discovered and resolved.*