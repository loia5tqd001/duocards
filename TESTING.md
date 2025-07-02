# Testing Documentation

This document provides comprehensive information about the testing setup, strategy, and best practices for the duocards application.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Framework and Tools](#framework-and-tools)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Testing Strategy

### Philosophy

We follow the **Testing Trophy** approach, prioritizing integration tests over unit tests for better confidence and user-focused testing.

### Test Categories

#### 1. Integration Tests (Primary Focus)

- **Purpose**: Test user workflows and component interactions
- **Coverage**: Critical user journeys, navigation flows, state management
- **Location**: `src/test/integration/`
- **Examples**: Navigation bugs, form submissions, data persistence

#### 2. Component Tests

- **Purpose**: Test individual components in isolation
- **Coverage**: Component rendering, prop handling, user interactions
- **Location**: `src/components/**/*.test.tsx`

#### 3. Unit Tests

- **Purpose**: Test pure functions and utilities
- **Coverage**: Business logic, utility functions, data transformations
- **Location**: `src/lib/**/*.test.ts`

### Bug Prevention Strategy

- **Regression Tests**: Each fixed bug gets comprehensive test coverage
- **Documentation**: All bugs documented in `BUGS_DOCUMENTED.md`
- **Test-Driven Fixes**: Write failing tests before fixing bugs

---

## Framework and Tools

### Core Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast, Vite-native test runner
- **Testing Library**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - User-centric testing
- **User Interactions**: [Testing Library User Event](https://testing-library.com/docs/user-event/intro/)
- **Assertions**: [Vitest Expect](https://vitest.dev/api/expect.html) + [jest-dom](https://github.com/testing-library/jest-dom)

### Additional Tools

- **Coverage**: V8 coverage provider
- **DOM Environment**: happy-dom (faster alternative to jsdom)
- **Visual Testing**: Vitest UI for test exploration
- **Mocking**: Built-in Vitest mocking capabilities

### Development Dependencies

```json
{
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^14.6.1",
  "@vitest/coverage-v8": "^3.2.4",
  "@vitest/ui": "^3.2.4",
  "happy-dom": "^18.0.1",
  "vitest": "^3.2.4"
}
```

---

## Test Structure

### Directory Layout

```
src/test/
├── setup.ts                     # Global test setup
├── test-utils.tsx               # Custom render utilities
└── integration/
    ├── navigation-state-bugs.test.tsx  # Bug regression tests
    └── user-workflows.test.tsx         # End-to-end user journeys

src/components/
└── **/*.test.tsx                # Component-specific tests

src/lib/
└── **/*.test.ts                 # Utility function tests
```

### Test File Naming Conventions

- **Integration tests**: `*.test.tsx` in `src/test/integration/`
- **Component tests**: `ComponentName.test.tsx` next to component
- **Unit tests**: `utility.test.ts` next to utility file
- **Mock files**: `__mocks__/` directory or `*.mock.ts`

### Test Organization

```typescript
describe('Feature/Component Name', () => {
  beforeEach(() => {
    // Setup for each test
  });

  describe('Primary functionality', () => {
    it('should handle the main use case', () => {
      // Test implementation
    });
  });

  describe('Edge cases', () => {
    it('should handle error conditions', () => {
      // Edge case testing
    });
  });

  describe('Regression tests', () => {
    it('should prevent BUG-XXX from recurring', () => {
      // Bug prevention tests
    });
  });
});
```

---

## Running Tests

### Available Scripts

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests once (CI mode)
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui

# Run specific test file
pnpm test:run src/test/integration/navigation-state-bugs.test.tsx

# Run tests matching pattern
pnpm test:run --grep "BUG-001"
```

### Development Workflow

```bash
# 1. Start development server
pnpm dev

# 2. Run tests in watch mode (separate terminal)
pnpm test:ui

# 3. Write tests and implementation code
# Tests will re-run automatically on changes
```

### Pre-commit Testing

```bash
# Run before committing
pnpm test:run && pnpm lint
```

---

## Writing Tests

### Test Utilities

We provide comprehensive test utilities in `src/test/test-utils.tsx`:

#### Custom Render Functions

```typescript
import { renderWithRouter, renderWithCards, renderInEditMode } from '@test/test-utils';

// Render with React Router
const { user } = renderWithRouter(<Component />);

// Render with mock card data
const { user } = renderWithCards(<App />);

// Render in edit mode with specific card
const { user } = renderInEditMode(<App />, 'card-id');
```

#### Navigation Helpers

```typescript
import {
  navigateToHome,
  navigateToAddCard,
  navigateToEditCard,
} from '@test/test-utils';

// Navigate to different screens
await navigateToHome(user);
await navigateToAddCard(user);
await navigateToEditCard(user, 0); // Edit first card
```

#### Assertion Helpers

```typescript
import {
  expectToBeInDocument,
  expectFormField,
  expectButton,
} from '@test/test-utils';

// Common assertions
expectToBeInDocument('Expected text');
expectFormField('Field Label', 'expected value');
expectButton('Submit', { disabled: false });
```

#### Mock Utilities

```typescript
import {
  mockCambridgeAPI,
  mockNetworkError,
  resetAllStores,
} from '@test/test-utils';

beforeEach(() => {
  resetAllStores();
  mockCambridgeAPI({ word: 'test', phonetic: '/test/' });
});
```

### Test Data Management

```typescript
import { createMockCard, createMockCardSet } from '@test/test-utils';

// Create test data
const mockCard = createMockCard({ english: 'test', vietnamese: 'thử nghiệm' });
const mockCards = createMockCardSet(); // Pre-defined set of 3 cards
```

### Writing Integration Tests

#### 1. Test User Workflows

```typescript
it('should allow user to add a new card', async () => {
  const { user } = renderWithCards(<App />);

  // Navigate to add card form
  await navigateToAddCard(user);

  // Fill out form
  await user.type(screen.getByPlaceholderText('Enter English word'), 'hello');
  await user.type(screen.getByPlaceholderText('Vietnamese translation'), 'xin chào');

  // Submit form
  await user.click(screen.getByRole('button', { name: /add card/i }));

  // Verify success
  expectToBeInDocument('Card added successfully!');
});
```

#### 2. Test Navigation Flows

```typescript
it('should maintain state consistency across navigation', async () => {
  const { user } = renderWithCards(<App />);

  // Test specific navigation sequence
  await navigateToAddCard(user);
  await navigateToHome(user);
  await navigateToEditCard(user, 0);

  // Verify correct state
  expectToBeInDocument('✏️ Edit Card');
  expectFormField('English', 'expected value');
});
```

#### 3. Test Error Scenarios

```typescript
it('should handle network errors gracefully', async () => {
  mockNetworkError();
  const { user } = renderWithCards(<App />);

  // Trigger network request
  await navigateToAddCard(user);
  await user.type(screen.getByPlaceholderText('Enter English word'), 'test');

  // Verify error handling
  await waitFor(() => {
    expectToBeInDocument('Failed to fetch data');
  });
});
```

### Writing Component Tests

```typescript
describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expectToBeInDocument('Click me');
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

---

## Best Practices

### General Testing Principles

#### 1. Test User Behavior, Not Implementation

```typescript
// ❌ Bad - Testing implementation details
expect(component.state.isLoading).toBe(true);

// ✅ Good - Testing user-visible behavior
expectToBeInDocument('Loading...');
```

#### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it('should work', () => {});

// ✅ Good
it('should display error message when form submission fails', () => {});
```

#### 3. Follow Arrange-Act-Assert Pattern

```typescript
it('should add new card when form is submitted', async () => {
  // Arrange
  const { user } = renderWithCards(<App />);

  // Act
  await navigateToAddCard(user);
  await fillCardForm(user, { english: 'test', vietnamese: 'thử nghiệm' });
  await submitForm(user);

  // Assert
  expectToBeInDocument('Card added successfully!');
});
```

#### 4. Keep Tests Independent

```typescript
beforeEach(() => {
  resetAllStores(); // Clean state for each test
  mockCambridgeAPI(); // Reset mocks
});
```

### React Testing Library Best Practices

#### 1. Use Semantic Queries

```typescript
// ✅ Preferred order of queries
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email address');
screen.getByText('Welcome');
screen.getByDisplayValue('current input value');
screen.getByPlaceholderText('Enter email');

// ❌ Avoid unless necessary
screen.getByTestId('submit-button');
```

#### 2. Use User Event Instead of Fire Event

```typescript
// ❌ Don't use fireEvent directly
fireEvent.click(button);

// ✅ Use userEvent for realistic interactions
await user.click(button);
await user.type(input, 'text');
```

#### 3. Wait for Async Updates

```typescript
// ✅ Wait for UI updates
await waitFor(() => {
  expectToBeInDocument('Data loaded');
});

// ✅ Find elements that will appear
const element = await screen.findByText('Data loaded');
```

### Performance Best Practices

#### 1. Use Efficient DOM Environment

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom', // Faster than jsdom
  },
});
```

#### 2. Mock Heavy Dependencies

```typescript
// Mock expensive operations
vi.mock('../lib/heavyComputation', () => ({
  complexCalculation: vi.fn(() => 'mocked result'),
}));
```

#### 3. Parallelize Tests Appropriately

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4, // Adjust based on system
      },
    },
  },
});
```

---

## Coverage Requirements

### Coverage Thresholds

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### Coverage Targets by File Type

- **Critical Components**: 95%+ coverage
- **Business Logic**: 90%+ coverage
- **UI Components**: 80%+ coverage
- **Utilities**: 95%+ coverage

### Excluded from Coverage

- Configuration files
- Test files
- Type definitions
- Mock files
- Development utilities

### Monitoring Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html

# Check coverage in CI
pnpm test:coverage --reporter=json
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test:run && pnpm lint"
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Failing Due to Timing

```typescript
// ❌ Problem: Race conditions
expect(screen.getByText('Loading...')).toBeInTheDocument();

// ✅ Solution: Wait for conditions
await waitFor(() => {
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

#### 2. Mock Not Working

```typescript
// ✅ Ensure mocks are properly hoisted
vi.mock('../lib/utils', () => ({
  speak: vi.fn(),
}));

// ✅ Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

#### 3. Memory Leaks in Tests

```typescript
// ✅ Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});
```

#### 4. Slow Test Execution

```typescript
// ✅ Use happy-dom instead of jsdom
// ✅ Mock heavy computations
// ✅ Limit parallel threads appropriately
```

### Debug Tools

#### 1. Debug DOM State

```typescript
import { screen } from '@testing-library/react';
screen.debug(); // Prints current DOM
```

#### 2. Debug Store State

```typescript
import { debugStoreState } from '@test/test-utils';
debugStoreState(); // Prints all store states
```

#### 3. Debug Test Execution

```bash
# Run specific test with verbose output
pnpm test:run --grep "test name" --reporter=verbose
```

---

## Maintenance

### Regular Tasks

- **Weekly**: Review test coverage reports
- **Monthly**: Update test dependencies
- **Per Release**: Run full test suite including performance tests
- **Per Bug Fix**: Add regression tests

### Performance Monitoring

- Monitor test execution time
- Identify and optimize slow tests
- Maintain test independence

### Documentation Updates

- Update this document when testing practices change
- Document new test utilities
- Keep examples current with latest patterns

---

## Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Tools

- [Vitest UI](https://vitest.dev/guide/ui.html) - Visual test runner
- [Testing Playground](https://testing-playground.com/) - Query helper

### Team Guidelines

- Review testing checklist before code review
- Ensure new features include appropriate tests
- Maintain high test quality standards
