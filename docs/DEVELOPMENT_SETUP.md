# Development Setup Guide

Complete guide for setting up your development environment for Budget Buddy Mobile.

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Installation Steps](#installation-steps)
- [Environment Configuration](#environment-configuration)
- [IDE Setup](#ide-setup)
- [Development Tools](#development-tools)
- [Platform-Specific Setup](#platform-specific-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
- **Node.js**: Version 18.0.0 or higher
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 10GB free space for development tools and dependencies

### Recommended Specifications
- **Memory**: 16GB+ RAM for optimal performance
- **Storage**: SSD with 20GB+ free space
- **CPU**: Multi-core processor for faster builds
- **Internet**: Stable connection for package downloads and EAS builds

## Installation Steps

### 1. Node.js and npm

#### Install Node.js
Download and install from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

#### Alternative: Using Node Version Manager (Recommended)

**Windows (nvm-windows):**
```bash
# Install nvm-windows from: https://github.com/coreybutler/nvm-windows
nvm install 18.17.0
nvm use 18.17.0
```

**macOS/Linux (nvm):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 18.17.0
nvm use 18.17.0
nvm alias default 18.17.0
```

### 2. Global CLI Tools

Install required global packages:
```bash
# Expo CLI
npm install -g @expo/cli

# EAS CLI for builds
npm install -g eas-cli

# TypeScript (optional, for global usage)
npm install -g typescript

# React Native CLI (optional, for debugging)
npm install -g react-native-cli
```

Verify installations:
```bash
expo --version
eas --version
```

### 3. Git Configuration

Install Git from [git-scm.com](https://git-scm.com/) if not already installed.

Configure Git:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 4. Project Setup

Clone and setup the project:
```bash
# Clone the repository
git clone https://github.com/jekportillano-da/Budget-Buddy-Mobile.git
cd Budget-Buddy-Mobile

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
```

## Environment Configuration

### Environment Variables

Edit `.env.local` with your configuration:
```bash
# Required for AI features
GROK_API_KEY=your_grok_api_key_here

# Optional development settings
DEV_MODE=true
LOG_LEVEL=debug
```

### EAS Configuration

Login to EAS:
```bash
eas login
```

Verify project configuration:
```bash
eas build:configure  # If not already configured
```

## IDE Setup

### Visual Studio Code (Recommended)

#### Required Extensions
- **ES7+ React/Redux/React-Native snippets** - Shortcuts and snippets
- **TypeScript Importer** - Automatic import management
- **Expo Tools** - Expo development support
- **React Native Tools** - Debugging and IntelliSense
- **Prettier** - Code formatting
- **ESLint** - Code linting

#### Recommended Extensions
- **Auto Rename Tag** - HTML/JSX tag management
- **Bracket Pair Colorizer** - Visual bracket matching
- **GitLens** - Enhanced Git capabilities
- **Path Intellisense** - File path autocompletion
- **TODO Highlight** - Highlight TODO comments

#### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.json": "jsonc"
  }
}
```

### Alternative IDEs

#### WebStorm
- Built-in React Native support
- Excellent TypeScript integration
- Advanced debugging capabilities

#### Sublime Text
- React Native package available
- TypeScript syntax highlighting
- Multiple cursor editing

## Development Tools

### React Native Debugger (Optional)

Install React Native Debugger for enhanced debugging:
```bash
# macOS
brew install --cask react-native-debugger

# Windows - Download from GitHub releases
# https://github.com/jhen0409/react-native-debugger/releases
```

### Flipper (Optional)

Install Flipper for advanced debugging and inspection:
- Download from [fbflipper.com](https://fbflipper.com/)
- Install React Native plugin
- Configure for network inspection and layout debugging

## Platform-Specific Setup

### Android Development

#### Android Studio Installation
1. Download from [developer.android.com](https://developer.android.com/studio)
2. Install Android SDK and build tools
3. Create Android Virtual Device (AVD)

#### Environment Variables (Windows)
Add to system PATH:
```bash
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\YourUsername\AppData\Local\Android\Sdk
```

Add to PATH:
```bash
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

#### Environment Variables (macOS/Linux)
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

#### Verify Android Setup
```bash
adb --version
```

### iOS Development (macOS Only)

#### Xcode Installation
1. Install from Mac App Store
2. Install Command Line Tools: `xcode-select --install`
3. Accept license: `sudo xcodebuild -license accept`

#### iOS Simulator
```bash
# List available simulators
xcrun simctl list devices

# Start iOS simulator
open -a Simulator
```

#### CocoaPods
```bash
# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
```

## Verification

### Complete Setup Verification

Run the verification script:
```bash
# Check Expo doctor
npx expo-doctor

# Start development server
npx expo start
```

### Manual Verification Checklist

- [ ] Node.js version 18+ installed
- [ ] npm/yarn working correctly
- [ ] Expo CLI installed and working
- [ ] EAS CLI installed and authenticated
- [ ] Git configured with user details
- [ ] Project dependencies installed
- [ ] Environment variables configured
- [ ] Android emulator running (for Android development)
- [ ] iOS simulator working (for iOS development, macOS only)

### Test Basic Functionality

```bash
# Run project checks
npm run test  # When tests are added

# Start development server
npx expo start

# Test Android build (requires emulator)
npx expo run:android

# Test iOS build (macOS only, requires simulator)
npx expo run:ios
```

## Troubleshooting

### Common Issues

#### Node.js Version Conflicts
```bash
# Use nvm to manage Node versions
nvm list
nvm use 18.17.0
```

#### Permission Issues (macOS/Linux)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

#### Metro Bundle Issues
```bash
# Clear Metro cache
npx expo start --clear
```

#### Android Setup Issues
```bash
# Verify Android configuration
npx react-native doctor

# List connected devices
adb devices
```

### Performance Optimization

#### Development Server Performance
- **Close unnecessary applications** to free up memory
- **Use wired connection** for better stability
- **Disable unused Metro features** in development

#### Build Performance
- **Use SSD storage** for better I/O performance
- **Increase Node.js memory limit**: `export NODE_OPTIONS="--max-old-space-size=8192"`
- **Close IDE** during builds to free up memory

### Getting Help

#### Documentation Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

#### Community Support
- [Expo Discord](https://chat.expo.dev/)
- [React Native Community](https://reactnative.dev/help)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

## Next Steps

After completing the setup:

1. **Familiarize yourself** with the project structure
2. **Read the Contributing Guidelines** (CONTRIBUTING.md)
3. **Set up your development workflow** with hot reloading
4. **Test on multiple devices** for compatibility
5. **Join the development discussion** on GitHub Issues

---

*This guide will be updated as development tools and requirements evolve.*
