module.exports = {
  // The root of your source code
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // File extensions Jest will look for
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Transform files with babel-jest
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Module name mapper for non-JS modules and aliases
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  
  // Code coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  
  // Ignore certain directories
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Verbose output
  verbose: true,
};
