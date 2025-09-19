# Budget Buddy Mobile - Testing Build Guide

## 🚀 Building APK for Backend Integration Testing

### Version Information
- **App Version**: 1.1.0
- **Build Number**: 2 (iOS) / Auto-increment (Android)
- **Backend URL**: https://budget-buddy-mobile.onrender.com
- **Build Profile**: `testing`

### Prerequisites
1. **EAS CLI installed**: `npm install -g @expo/eas-cli`
2. **Expo account configured**: `eas login`
3. **Project initialized**: `eas build:configure` (if not done)

### Build Commands

#### 🎯 **Recommended: Testing APK Build**
```bash
eas build --profile testing --platform android
```

#### 📦 **Alternative: Preview APK Build**
```bash
eas build --profile preview --platform android
```

#### 🔄 **Development Build (for Expo Go)**
```bash
eas build --profile development --platform android
```

### Configuration Summary

#### 🔧 **Testing Profile Features:**
- ✅ **Live Backend Integration**: Points to deployed Render.com API
- ✅ **Full API Mode**: All requests go through backend
- ✅ **Authentication**: Uses backend JWT tokens
- ✅ **AI Services**: Routes through backend AI endpoints
- ✅ **Fallback Enabled**: Graceful degradation if backend unavailable
- ✅ **Optimized Timeouts**: 10-second timeout for network requests

#### 📱 **APK Configuration:**
- **Package**: `com.budgetbuddy.mobile`
- **Distribution**: Internal testing
- **Build Type**: Release APK
- **Auto-increment**: Version codes automatically managed

### Testing Checklist

After build completion:

#### 🔍 **Basic Functionality**
- [ ] App launches successfully
- [ ] Backend health check passes
- [ ] API configuration loads correctly

#### 🔐 **Authentication Flow**
- [ ] User registration works
- [ ] Login/logout functionality
- [ ] JWT token management
- [ ] Protected route access

#### 🤖 **AI Features**
- [ ] AI chat functionality
- [ ] Financial insights generation
- [ ] Recommendations engine

#### 📊 **Core Features**
- [ ] Budget creation and management
- [ ] Expense tracking
- [ ] Savings goals
- [ ] Data persistence

### Build Monitoring

#### 📈 **EAS Build Dashboard**
- Monitor build progress: `eas build:list`
- Check build logs for any issues
- Download APK from Expo dashboard

#### 🔍 **Runtime Monitoring**
- Check backend health: https://budget-buddy-mobile.onrender.com/health
- API documentation: https://budget-buddy-mobile.onrender.com/docs
- Monitor backend logs in Render.com dashboard

### Troubleshooting

#### ❌ **Common Issues:**
1. **Build Fails**: Check EAS CLI version and project configuration
2. **Backend Connection**: Verify Render.com deployment is live
3. **Authentication Errors**: Check JWT token handling in API calls
4. **API Timeouts**: Adjust `EXPO_PUBLIC_BACKEND_TIMEOUT` if needed

#### 🔧 **Quick Fixes:**
- Clear Expo cache: `expo r -c`
- Restart EAS build: `eas build --clear-cache`
- Check environment variables in build logs

### Next Steps

After successful APK testing:
1. **Performance optimization**
2. **User experience refinements**
3. **Production build preparation**
4. **App store submission**

---
**Built with ❤️ for comprehensive backend integration testing**