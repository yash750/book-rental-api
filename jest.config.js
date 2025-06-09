module.exports = {
    testMatch: ['**/tests/generated/**/*.test.js'],
    reporters: ["default", ["jest-junit", { outputDirectory: ".", outputName: "junit.xml" }]],
    collectCoverage: true,
    coverageDirectory: "coverage",
  };
  