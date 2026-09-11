module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  // The Lambda handlers under test declare their @aws-sdk/* deps in functions/package.json,
  // not the top-level infrastructure package — point the resolver there instead of duplicating them.
  modulePaths: ['<rootDir>/functions/node_modules'],
  // functions/ carries stale, gitignored *.js/*.d.ts build output alongside the .ts source
  // (from local `tsc` runs). Jest's default extension order resolves .js first, which would
  // silently test that stale output instead of the current source — put .ts first.
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'test/tsconfig.json' }]
  },
  setupFilesAfterEnv: ['aws-cdk-lib/testhelpers/jest-autoclean'],
};
