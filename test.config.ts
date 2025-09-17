/**
 * Test configuration for the Ride Assignment Algorithm project
 * Provides centralized test settings and utilities
 */

export const testConfig = {
  // Test execution settings
  execution: {
    timeout: 30000, // 30 seconds default timeout
    concurrency: 4, // Run up to 4 tests concurrently
    retries: 2, // Retry failed tests up to 2 times
  },

  // Performance testing thresholds
  performance: {
    smallDataset: { drivers: 10, rides: 20, maxDuration: 1000 }, // 1 second
    mediumDataset: { drivers: 50, rides: 100, maxDuration: 5000 }, // 5 seconds
    largeDataset: { drivers: 100, rides: 200, maxDuration: 10000 }, // 10 seconds
    memoryTest: { iterations: 5, maxDegradation: 0.5 }, // 50% max performance degradation
  },

  // Coverage requirements
  coverage: {
    minimum: {
      lines: 90,
      functions: 85,
      branches: 80,
      statements: 90,
    },
    critical: {
      lines: 100, // Critical paths must have 100% coverage
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },

  // Test data settings
  testData: {
    locations: {
      hadera: { lat: 32.4356, lng: 34.9178 },
      givatBilu: { lat: 32.4400, lng: 34.9200 },
      yoseftal: { lat: 32.4300, lng: 34.9150 },
    },
    timeRanges: {
      morning: { start: '06:00', end: '12:00' },
      afternoon: { start: '12:00', end: '18:00' },
      evening: { start: '18:00', end: '22:00' },
      night: { start: '22:00', end: '06:00' },
    },
    shiftPatterns: [
      [{ start: '06:00', end: '14:00' }], // Early shift
      [{ start: '14:00', end: '22:00' }], // Late shift
      [{ start: '08:00', end: '16:00' }], // Day shift
      [{ start: '06:00', end: '10:00' }, { start: '14:00', end: '18:00' }], // Split shift
      [{ start: '07:00', end: '15:00' }], // Standard shift
    ],
  },

  // Quality gates
  qualityGates: {
    allTestsPass: true,
    coverageThreshold: 'minimum',
    performanceThreshold: 'mediumDataset',
    noFlakyTests: true,
    noMemoryLeaks: true,
  },

  // Test categories
  categories: {
    unit: {
      pattern: '*.test.ts',
      timeout: 5000,
      parallel: true,
    },
    integration: {
      pattern: '*.integration.test.ts',
      timeout: 15000,
      parallel: false,
    },
    performance: {
      pattern: '*.performance.test.ts',
      timeout: 30000,
      parallel: false,
    },
    e2e: {
      pattern: '*.e2e.test.ts',
      timeout: 60000,
      parallel: false,
    },
  },

  // Reporting settings
  reporting: {
    output: {
      console: true,
      json: true,
      html: true,
      junit: true,
    },
    coverage: {
      reporters: ['text', 'html', 'json'],
      exclude: [
        '**/node_modules/**',
        '**/test/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/coverage/**',
      ],
    },
  },

  // Environment settings
  environment: {
    node: {
      version: '>=18.0.0',
      memory: '4GB',
    },
    test: {
      isolated: true,
      cleanup: true,
      mockExternal: true,
    },
  },
};

/**
 * Test utility functions
 */
export const testUtils = {
  /**
   * Create test data based on configuration
   */
  createTestData(type: 'small' | 'medium' | 'large') {
    const config = testConfig.performance[`${type}Dataset`];
    return {
      driverCount: config.drivers,
      rideCount: config.rides,
      maxDuration: config.maxDuration,
    };
  },

  /**
   * Get performance thresholds for a test type
   */
  getPerformanceThreshold(type: 'small' | 'medium' | 'large') {
    return testConfig.performance[`${type}Dataset`];
  },

  /**
   * Check if test should run based on category
   */
  shouldRunTest(category: string, environment: string = 'default') {
    const categoryConfig = testConfig.categories[category];
    if (!categoryConfig) return false;
    
    // Add environment-specific logic here
    return true;
  },

  /**
   * Get test timeout for a category
   */
  getTestTimeout(category: string) {
    const categoryConfig = testConfig.categories[category];
    return categoryConfig?.timeout || testConfig.execution.timeout;
  },

  /**
   * Validate test results against quality gates
   */
  validateResults(results: any) {
    const gates = testConfig.qualityGates;
    const issues = [];

    if (gates.allTestsPass && results.failed > 0) {
      issues.push(`${results.failed} tests failed`);
    }

    if (gates.coverageThreshold && results.coverage) {
      const threshold = testConfig.coverage[gates.coverageThreshold];
      if (results.coverage.lines < threshold.lines) {
        issues.push(`Line coverage ${results.coverage.lines}% below threshold ${threshold.lines}%`);
      }
    }

    if (gates.noFlakyTests && results.flaky > 0) {
      issues.push(`${results.flaky} flaky tests detected`);
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  },
};

export default testConfig;
