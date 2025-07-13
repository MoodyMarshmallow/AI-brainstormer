/**
 * ===================================================================
 * JEST CONFIGURATION - Forum AI Brainstorming Application
 * ===================================================================
 * 
 * This file configures Jest testing framework for the Forum application.
 * It sets up TypeScript support, ESM modules, and test discovery patterns
 * for comprehensive testing of server-side functionality.
 * 
 * Configuration Features:
 * - TypeScript support with ts-jest preset
 * - ES Modules (ESM) compatibility
 * - Node.js test environment for server testing
 * - Automatic test discovery in __tests__ directories
 * - Module name mapping for clean imports
 * 
 * Test Setup:
 * - Preset: ts-jest/presets/default-esm for TypeScript + ESM
 * - Environment: Node.js for server-side testing
 * - Extensions: .ts files treated as ES modules
 * - Transform: TypeScript compilation with ESM support
 * 
 * Test Discovery:
 * - Files in __tests__ directories
 * - Files with .test.ts or .spec.ts extensions
 * - Automatic detection and execution
 * 
 * Module Resolution:
 * - Maps .js imports to TypeScript files
 * - Supports ES module import syntax
 * - Compatible with TypeScript path mapping
 * 
 * Dependencies:
 * - Jest testing framework
 * - ts-jest for TypeScript support
 * - ES Modules compatibility
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  }
};