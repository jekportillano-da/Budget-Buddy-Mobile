# Contributing to Budget Buddy Mobile 🤝

Thank you for your interest in contributing to Budget Buddy Mobile! We welcome contributions from developers of all skill levels.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Standards](#documentation-standards)
- [Issue Reporting](#issue-reporting)

## 📜 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- **Be respectful** and inclusive in all interactions
- **Be collaborative** and help others learn
- **Be constructive** in feedback and criticism
- **Focus on the project goals** and user experience

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18 or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **Expo CLI** installed globally
- **EAS CLI** for builds
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Budget-Buddy-Mobile.git
   cd Budget-Buddy-Mobile
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/jekportillano-da/Budget-Buddy-Mobile.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

6. **Run the development server**:
   ```bash
   npx expo start
   ```

## 🔄 Development Process

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Examples:
- `feature/add-expense-tracking`
- `bugfix/fix-splash-screen-hanging`
- `docs/update-api-documentation`

### Commit Message Format

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add user authentication system
fix(navigation): resolve tab navigation crash on Android
docs(readme): update installation instructions
```

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our code style guidelines

3. **Test your changes** thoroughly:
   ```bash
   npm run test  # When tests are implemented
   npx expo run:android  # Test on Android
   npx expo run:ios  # Test on iOS (if available)
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): your descriptive commit message"
   ```

5. **Keep your branch updated**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

## 🔀 Pull Request Process

### Before Submitting

- [ ] Ensure your code follows our style guidelines
- [ ] Test your changes on both Android and iOS (if possible)
- [ ] Update documentation if needed
- [ ] Add or update tests for new functionality
- [ ] Ensure no linting errors exist
- [ ] Verify the build process works correctly

### Pull Request Guidelines

1. **Create a Pull Request** with a clear title and description
2. **Link relevant issues** using keywords (e.g., "Closes #123")
3. **Provide context** about what changes were made and why
4. **Include screenshots** for UI changes
5. **Request reviews** from maintainers

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tested on Android
- [ ] Tested on iOS
- [ ] Added/updated tests

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

## 🎨 Code Style Guidelines

### TypeScript Standards

- **Use TypeScript** for all new code
- **Define interfaces** for all data structures
- **Use explicit types** when type inference isn't clear
- **Prefer `const` over `let`** when possible

### React Native Best Practices

- **Use functional components** with hooks
- **Follow React Native style guidelines**
- **Use StyleSheet.create()** for component styles
- **Implement proper error boundaries**

### File Organization

- **Group related files** in appropriate directories
- **Use index.ts files** for clean imports
- **Keep components small** and focused
- **Separate business logic** from UI components

### Code Formatting

We use Prettier and ESLint for code formatting:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🧪 Testing Guidelines

### Testing Strategy

- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test component interactions
- **E2E Tests** - Test complete user workflows
- **Manual Testing** - Test on actual devices

### Writing Tests

```typescript
// Example test structure
import { render, fireEvent } from '@testing-library/react-native';
import { BudgetComponent } from '../BudgetComponent';

describe('BudgetComponent', () => {
  test('should render budget amount correctly', () => {
    const { getByText } = render(<BudgetComponent amount={1000} />);
    expect(getByText('$1,000.00')).toBeTruthy();
  });
});
```

## 📖 Documentation Standards

### Code Documentation

- **Document complex functions** with JSDoc comments
- **Explain business logic** and algorithms
- **Include usage examples** for components
- **Keep comments up to date** with code changes

### README Updates

- **Update feature lists** when adding new functionality
- **Maintain installation instructions** accuracy
- **Update screenshots** when UI changes
- **Keep tech stack information** current

## 🐛 Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the FAQ** and documentation
3. **Try the latest version** to see if the issue is resolved
4. **Gather relevant information** about your environment

### Issue Template

```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. iOS, Android]
- Device: [e.g. iPhone 12, Samsung Galaxy S21]
- App Version: [e.g. 1.0.0]
- Expo SDK Version: [e.g. 51.0.0]

**Additional Context**
Add any other context about the problem here.
```

## 🏷️ Labels and Milestones

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested

### Milestones

- **Phase 1** - Build infrastructure and navigation
- **Phase 2** - Core functionality development
- **Phase 3** - AI integration and advanced features

## 🎯 Areas for Contribution

We especially welcome contributions in these areas:

### High Priority
- **UI/UX improvements** - Making the app more intuitive
- **Performance optimization** - Improving app speed and responsiveness
- **Accessibility** - Making the app usable for everyone
- **Testing** - Adding comprehensive test coverage

### Medium Priority
- **Documentation** - Improving guides and examples
- **Code refactoring** - Improving code quality and maintainability
- **Feature enhancements** - Adding new functionality
- **Bug fixes** - Resolving existing issues

### Future Opportunities
- **iOS support** - Platform-specific features
- **Advanced AI features** - Enhanced financial insights
- **Internationalization** - Multi-language support
- **Web version** - Expo web compatibility

## 💬 Getting Help

If you need help while contributing:

- **Join our discussions** on GitHub Discussions
- **Ask questions** in issue comments
- **Review existing documentation** and code examples
- **Reach out to maintainers** for guidance

## 🙏 Recognition

Contributors will be recognized in:

- **README.md** contributor section
- **Release notes** for significant contributions
- **Project documentation** for major features
- **Social media** for outstanding contributions

---

Thank you for contributing to Budget Buddy Mobile! Together, we're building a better financial management experience for everyone. 🚀

*Last updated: September 14, 2025*
