# @hackforplay/monorepo

Monorepo for HackforPlay packages

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm latest version](https://img.shields.io/npm/v/@hackforplay/common/latest.svg)](https://www.npmjs.com/package/@hackforplay/common)

## Packages

- [@hackforplay/common](./packages/game/README.md) - Common package for building stages in hackforplay

## Development

- `npm install` - Install dependencies for all packages
- `npm run build` - Build all packages
- `npm run test` - Test all packages

### Working on a specific package

- `cd packages/game` - Navigate to the package directory
- `npm start` - Start the development server for the package
- Then use library from `http://localhost:8080/register.js`

## Adding a new package

1. Create a new directory in the `packages` directory
2. Initialize the package with `npm init`
3. Add the necessary configuration files (tsconfig.json, webpack.config.js, etc.)
4. Add the package to the workspace by updating the root package.json

## Deploy

- `git push origin`
- Then start automatic deploying via [semantic-release](https://github.com/semantic-release/semantic-release)

or manual deploy

- `npx np`
- Then start interactive shell via [np](https://github.com/sindresorhus/np)
