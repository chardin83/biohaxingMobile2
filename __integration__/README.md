# Integration Tests

This directory contains integration tests that test the interaction between real components, services, and storage context in the biohaxingMobile app. Unlike unit tests that mock dependencies, these tests use real implementations to verify the complete workflows work correctly.

## Test Files

### 1. StorageContext.integration.test.tsx
Tests the integration between the StorageContext and real AsyncStorage:
- Persistence and loading of plans, goals, XP, and nutrition data
- Data initialization from existing AsyncStorage
- Error handling and state consistency

### 2. GoalManagement.integration.test.tsx
Tests the complete goal management workflow:
- Goal starting, progress tracking, and completion
- Integration with real StorageContext for state persistence
- Multiple concurrent goals management
- XP progression and achievement tracking

### 3. Services.integration.test.tsx
Tests the integration between services and application state:
- GPT service integration with real plan data from storage
- System prompt building with actual user plans
- File analysis service with real API structure
- Service error handling and state updates

### 4. Navigation.integration.test.tsx
Tests navigation flow and state restoration:
- Onboarding flow navigation based on storage state
- App initialization and routing decisions
- State restoration from AsyncStorage on app start
- Error recovery in navigation

### 5. Components.integration.test.tsx
Tests real component integration with storage context:
- NutritionLogger component with real data persistence
- Cross-component state sharing and updates
- Complex state scenarios across multiple components

## Running Integration Tests

Run all integration tests:
```bash
npm test -- __integration__
```

Run specific integration test:
```bash
npm test -- __integration__/StorageContext.integration.test.tsx
```

Run integration tests in watch mode:
```bash
npm test -- --watch __integration__
```

## Test Status

All integration tests are passing! ✅

### Test Results Summary:
- **StorageContext.integration.test.tsx**: 5/5 tests passing ✅
- **GoalManagement.integration.test.tsx**: 3/3 tests passing ✅  
- **Services.integration.test.tsx**: 7/7 tests passing ✅
- **Navigation.integration.test.tsx**: 7/7 tests passing ✅
- **Components.integration.test.tsx**: 2/2 tests passing ✅

**Total: 24 integration tests passing**

## Key Integration Points Tested

1. **Real AsyncStorage Persistence**: Tests use actual AsyncStorage instead of mocks
2. **Component-to-Component Data Flow**: Verifies data flows correctly between components
3. **Service Integration**: Tests real service logic with application state
4. **Navigation State Management**: Ensures routing works with real storage context
5. **Cross-Feature Integration**: Tests how different app features work together

## Test Patterns

### Storage Integration Pattern
```typescript
// Real storage context with AsyncStorage
render(
  <StorageProvider>
    <YourComponent />
  </StorageProvider>
);

// Verify persistence
const storedData = await AsyncStorage.getItem('key');
expect(JSON.parse(storedData)).toEqual(expectedData);
```

### Service Integration Pattern
```typescript
// Mock fetch but use real service logic
global.fetch = jest.fn().mockResolvedValue(mockResponse);

// Test with real data from storage context
const result = await serviceFunction(realDataFromContext);
```

### Component Integration Pattern
```typescript
// Use real context and components together
const TestWrapper = () => {
  const ctx = useStorage();
  return <RealComponent />;
};

render(
  <StorageProvider>
    <TestWrapper />
  </StorageProvider>
);
```

## Differences from Unit Tests

- **Real Dependencies**: Uses actual AsyncStorage, real components, real services
- **End-to-End Workflows**: Tests complete user workflows rather than isolated functions
- **Data Persistence**: Verifies actual data persistence and restoration
- **Cross-Component Communication**: Tests how components share and update state
- **Real-World Scenarios**: Tests complex scenarios that mirror actual usage

## Benefits

1. **Confidence in Integration**: Ensures components work together correctly
2. **Data Persistence Validation**: Verifies data survives app restarts
3. **Workflow Testing**: Tests complete user journeys
4. **Regression Prevention**: Catches integration issues that unit tests miss
5. **Performance Insights**: Reveals performance issues in real scenarios