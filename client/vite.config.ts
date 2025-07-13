/**
 * ===================================================================
 * VITE CONFIGURATION - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This file configures the Vite build tool for the Forum React application.
 * It sets up development server settings, proxy configuration for API calls,
 * and build optimization settings.
 * 
 * Configuration Features:
 * - React plugin integration for JSX/TSX support
 * - Development server on port 5173
 * - API proxy to backend server (localhost:3000)
 * - Build output directory configuration
 * - Hot module replacement for development
 * 
 * Development Setup:
 * - Server: http://localhost:5173
 * - API Proxy: /api/* -> http://localhost:3000/api/*
 * - Hot reloading enabled
 * - Source maps for debugging
 * 
 * Production Build:
 * - Optimized bundle output to dist/ directory
 * - Tree shaking for smaller bundle sizes
 * - Static asset optimization
 * - TypeScript compilation
 * 
 * Dependencies:
 * - Vite build tool
 * - React plugin for Vite
 * - TypeScript support
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the Forum client application.
 * 
 * Configures development server, API proxying, and build settings
 * for optimal development experience and production builds.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist'
  }
}); 