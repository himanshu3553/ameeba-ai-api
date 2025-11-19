# Testing Guide

This document provides information about running tests and understanding test coverage for the Ameeba AI API.

## Prerequisites

Before running tests, ensure you have installed all dependencies:

```bash
npm install
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

This will watch for file changes and automatically re-run tests.

### Run Tests with Coverage

```bash
npm run test:coverage
```

This will:
- Run all tests
- Generate a coverage report
- Display coverage summary in the terminal
- Generate HTML coverage report in `coverage/` directory

### Run Tests for CI/CD

```bash
npm run test:ci
```

This runs tests with coverage in CI mode (no watch, exit on failure).

## Test Coverage

The project uses Jest for testing with the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Viewing Coverage Reports

After running `npm run test:coverage`, you can:

1. **Terminal Output**: Coverage summary is displayed in the terminal
2. **HTML Report**: Open `coverage/index.html` in a browser for detailed coverage
3. **LCOV Report**: `coverage/lcov.info` for integration with coverage tools

## Test Structure

Tests are organized in the `src/__tests__/` directory:

```
src/__tests__/
├── setup.ts                    # Global test setup
├── services/                   # Service layer tests
│   ├── authService.test.ts
│   └── projectService.test.ts
├── controllers/                # Controller tests (if needed)
├── middleware/                 # Middleware tests
│   ├── auth.test.ts
│   └── errorHandler.test.ts
└── utils/                      # Utility tests
    ├── validation.test.ts
    └── responseHelpers.test.ts
```

## Test Environment

- **Test Database**: Uses MongoDB Memory Server (in-memory database)
- **Isolation**: Each test runs in isolation with a clean database state
- **Setup**: Global setup file handles database connection/disconnection

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach`/`afterEach` for setup and cleanup
3. **Descriptive Names**: Use clear test descriptions
4. **Coverage**: Aim for high coverage of business logic
5. **Mocking**: Mock external dependencies when appropriate

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

- Tests exit with non-zero code on failure
- Coverage thresholds must be met
- All tests must pass

## Troubleshooting

### Tests Failing

1. Ensure MongoDB Memory Server dependencies are installed
2. Check that all environment variables are set
3. Verify database connection in test setup

### Coverage Below Threshold

1. Review uncovered code in `coverage/index.html`
2. Add tests for missing branches/statements
3. Consider if uncovered code needs testing

### Memory Issues

If tests consume too much memory:
- Reduce test timeout if needed
- Check for memory leaks in test cleanup
- Consider running tests in smaller batches

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript with Jest](https://jestjs.io/docs/getting-started#using-typescript)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

