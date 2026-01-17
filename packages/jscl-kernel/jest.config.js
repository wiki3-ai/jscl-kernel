const func = require('@jupyterlab/testutils/lib/jest-config');
const upstream = func(__dirname);

const esModules = ['lib0', 'y-protocols'].join('|');

let local = {
  preset: 'ts-jest/presets/js-with-babel',
  transformIgnorePatterns: [
    `/node_modules/(?!${esModules}).+\\.js/(?!(@jupyterlab/.*)/)`,
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'es2020',
        target: 'es2019',
        lib: ['es2020', 'dom'],
        moduleResolution: 'node',
        esModuleInterop: true,
      },
    },
  },
  testEnvironment: 'jsdom',
};

// Remove testRegex from upstream if it exists
delete upstream.testRegex;

Object.keys(local).forEach((option) => {
  upstream[option] = local[option];
});

// Override with specific testMatch
upstream.testMatch = ['**/test/**/*.spec.ts'];

module.exports = upstream;
