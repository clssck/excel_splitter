module.exports = {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["splitExcel.js"],
};
