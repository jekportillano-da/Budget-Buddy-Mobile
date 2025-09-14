# Budget Buddy Mobile 📱💰

> AI-powered personal finance manager with smart budgeting and insights

[![Platform](https://img.shields.io/badge/Platform-React%20Native-blue.svg)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-51-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Status](#project-status)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Building](#building)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Budget Buddy Mobile is a comprehensive personal finance management application built with React Native and Expo. The app leverages AI-powered insights to help users manage their budgets, track expenses, and make informed financial decisions.

### Key Capabilities
- **Smart Budget Management** - AI-powered budget recommendations and tracking
- **Expense Tracking** - Automatic categorization and insights
- **Bill Management** - Never miss a payment with intelligent reminders
- **Financial Insights** - AI-driven analysis of spending patterns
- **Cross-Platform** - Native iOS and Android applications

## ✨ Features

### Phase 1 (Completed ✅)
- [x] **Build Infrastructure** - Complete EAS build pipeline
- [x] **Navigation System** - File-based routing with Expo Router
- [x] **Splash Screen** - Proper loading and transition handling
- [x] **Welcome Screen** - User onboarding interface
- [x] **Android APK** - Functional production builds

### Phase 2 (Planned 🔄)
- [ ] **Dashboard** - Comprehensive financial overview
- [ ] **Budget Creation** - AI-assisted budget setup
- [ ] **Expense Tracking** - Manual and automated expense entry
- [ ] **Bill Management** - Payment reminders and tracking
- [ ] **Data Persistence** - SQLite database integration

### Phase 3 (Planned 🔮)
- [ ] **AI Integration** - Grok AI-powered insights
- [ ] **Advanced Analytics** - Spending pattern analysis
- [ ] **Goal Setting** - Financial goal tracking
- [ ] **Export Features** - Data export and reporting
- [ ] **iOS Build** - Complete iOS support

## 🛠 Tech Stack

### Core Framework
- **React Native** 0.74.5 - Mobile app framework
- **Expo SDK** 51 - Development and build platform
- **TypeScript** 5.3 - Type-safe development

### Navigation & UI
- **Expo Router** 3.5 - File-based navigation
- **React Native Safe Area Context** - Safe area handling
- **React Native Screens** - Native screen components

### State Management
- **Zustand** 5.0 - Lightweight state management
- **React Query** 5.87 - Server state management
- **Async Storage** 1.23 - Local data persistence

### Database & Storage
- **Expo SQLite** 14.0 - Local database
- **React Native Async Storage** - Key-value storage

### AI & Analytics
- **Grok AI Service** - AI-powered financial insights
- **React Native Chart Kit** - Data visualization

### Build & Deployment
- **EAS Build** - Cloud-based builds
- **EAS CLI** - Command-line tools
- **Metro** - JavaScript bundler

## 📊 Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ **Complete** | Build infrastructure, navigation, basic UI |
| **Phase 2** | 🔄 **Planning** | Core functionality, database, UI components |
| **Phase 3** | 📋 **Planned** | AI integration, advanced features, iOS |

### Latest Build Info
- **Platform**: Android APK
- **Build Type**: Internal Distribution
- **Last Successful Build**: September 12, 2025
- **EAS Build Profile**: Preview

## 🚀 Installation

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **EAS CLI** (`npm install -g eas-cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/jekportillano-da/Budget-Buddy-Mobile.git
cd Budget-Buddy-Mobile

# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android emulator
npx expo run:android

# Run on iOS simulator (macOS only)
npx expo run:ios
```

## 🔧 Development Setup

### Environment Configuration

1. **Copy environment template**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure API keys** in `.env.local`:
   ```bash
   GROK_API_KEY=your_grok_api_key_here
   ```

### Development Commands

```bash
# Start Expo development server
npm start

# Start with cache cleared
npm run start:clear

# Build for Android
npm run build:android

# Build for iOS
npm run build:ios

# Build for all platforms
npm run build:all

# Type checking
npx tsc --noEmit

# Expo doctor (dependency check)
npx expo-doctor
```

## 🏗 Building

### Development Builds

```bash
# Start development server
npx expo start

# Build development APK
npx eas build --platform android --profile development
```

### Production Builds

```bash
# Build Android APK (internal distribution)
npx eas build --platform android --profile preview

# Build production release
npx eas build --platform android --profile production
```

### EAS Build Profiles

| Profile | Platform | Purpose | Distribution |
|---------|----------|---------|--------------|
| `development` | Both | Development/debugging | Internal |
| `preview` | Both | Testing/QA | Internal APK/IPA |
| `production` | Both | App store release | Public |

## 📁 Project Structure

```
Budget-Buddy-Mobile/
├── app/                    # File-based routing (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── bills.tsx      # Bill management
│   │   ├── dashboard.tsx  # Main dashboard
│   │   ├── insights.tsx   # AI insights
│   │   ├── profile.tsx    # User profile
│   │   └── settings.tsx   # App settings
│   ├── _layout.tsx        # Root layout component
│   └── index.tsx          # Welcome/landing screen
├── assets/                # Static assets
│   ├── icon.png          # App icon
│   ├── splash.png        # Splash screen
│   └── adaptive-icon.png # Android adaptive icon
├── components/            # Reusable UI components
│   ├── BudgetChart.tsx   # Budget visualization
│   ├── DataPersistenceTest.tsx
│   └── navigation/       # Navigation components
├── services/             # Business logic & API services
│   ├── budgetService.ts  # Budget management
│   ├── databaseService.ts # Database operations
│   ├── grokAIService.ts  # AI integration
│   └── index.ts          # Service exports
├── stores/               # State management (Zustand)
│   ├── billsStore.ts     # Bills state
│   ├── budgetStore.ts    # Budget state
│   ├── insightsStore.ts  # Insights state
│   ├── userStore.ts      # User state
│   └── index.ts          # Store exports
├── utils/                # Utility functions
│   ├── currencyUtils.ts  # Currency formatting
│   └── logger.ts         # Logging utilities
├── docs/                 # Project documentation
├── .env.local           # Environment variables (local)
├── app.json             # Expo configuration
├── eas.json             # EAS Build configuration
├── package.json         # Dependencies & scripts
└── tsconfig.json        # TypeScript configuration
```

## 🔍 Key Files Explained

### Configuration Files
- **`app.json`** - Expo app configuration, icons, splash screen
- **`eas.json`** - EAS Build profiles and environment variables
- **`package.json`** - Dependencies, scripts, and project metadata
- **`tsconfig.json`** - TypeScript compiler configuration

### Core Application
- **`app/_layout.tsx`** - Root layout with providers (QueryClient, navigation)
- **`app/index.tsx`** - Welcome screen and initial app entry point
- **`app/(tabs)/`** - Main application screens in tab navigation

### Services & State
- **`services/`** - Business logic, API calls, database operations
- **`stores/`** - Zustand state management stores
- **`utils/`** - Helper functions and utilities

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following our code style
4. **Test thoroughly** on both platforms
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style
- Use **TypeScript** for all new code
- Follow **React Native** best practices
- Use **Expo** recommended patterns
- Maintain **95%+ test coverage** (when testing is implemented)

## 🔒 Security

- **Environment Variables**: Never commit API keys or sensitive data
- **Dependencies**: Regularly update dependencies for security patches
- **Build Security**: Use EAS Build's secure environment for production builds

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/jekportillano-da/Budget-Buddy-Mobile/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jekportillano-da/Budget-Buddy-Mobile/discussions)
- **Documentation**: [Project Wiki](https://github.com/jekportillano-da/Budget-Buddy-Mobile/wiki)

## 🙏 Acknowledgments

- **Expo Team** - For the amazing development platform
- **React Native Community** - For the robust mobile framework
- **Grok AI** - For AI-powered financial insights
- **Open Source Community** - For the incredible tools and libraries

---

**Made with ❤️ for better financial management**

*Last updated: September 14, 2025*
