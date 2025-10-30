const esModules = [
  '.*\\.mjs$', // Ensure .mjs files are transformed
  'flat/', // Handle "flat" npm package (if needed)
  'echarts', // Allow Jest to process ECharts (ESM)
  'ngx-echarts', // Allow Jest to process ngx-echarts (ESM)
  'zrender', // Required dependency of ECharts
].join('|');

export default {
  displayName: 'front',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/front',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/(?!${esModules})`],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
