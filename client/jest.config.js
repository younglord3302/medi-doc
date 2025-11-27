module.exports = {
  transformIgnorePatterns: [
    "node_modules/(?!(axios)/)"
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testEnvironment: 'jsdom',
};
