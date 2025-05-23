import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest", // DO NOT REMOVE
  testEnvironment: "node",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js"],
  // enable coverage with flag --coverage
  collectCoverageFrom: [
    // 'backend/helpers/*.ts',
    // 'backend/controllers/*.ts',
    // 'backend/routes/*.ts',
    // 'backend/example.ts',
    "**/*.ts", //from everything
    "!backend/**/*.test.ts",
  ],
  coverageDirectory: "coverage", // <-- Output folder for coverage reports
  coverageReporters: ["text", "lcov"], // <-- Formats: text summary + HTML report
};

export default config;
