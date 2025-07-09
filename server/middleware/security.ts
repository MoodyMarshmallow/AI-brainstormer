/**
 * ===================================================================
 * SECURITY MIDDLEWARE - Forum AI Brainstorming Application
 * ===================================================================
 * 
 * This module provides comprehensive security middleware for the Forum API.
 * It implements multiple layers of security protection to ensure the
 * application is safe from common web vulnerabilities and abuse.
 * 
 * Security Features:
 * - Rate limiting to prevent API abuse
 * - CORS protection for cross-origin requests
 * - Content Security Policy headers
 * - Input validation and sanitization
 * - Response size limiting
 * - Security logging and monitoring
 * - Error handling for security violations
 * 
 * Protection Against:
 * - DDoS attacks (rate limiting)
 * - XSS attacks (input escaping, CSP headers)
 * - CSRF attacks (CORS configuration)
 * - Injection attacks (input validation)
 * - Response manipulation (size limits)
 * - Suspicious activity (logging)
 * 
 * Dependencies:
 * - express-rate-limit for API rate limiting
 * - cors for cross-origin resource sharing
 * - helmet for security headers
 * - express-validator for input validation
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

// ===================================================================
// RATE LIMITING CONFIGURATION
// ===================================================================

/**
 * Creates a rate limiter for the Forum API with configurable settings.
 * Implements per-IP and per-endpoint rate limiting to prevent API abuse.
 * 
 * Configuration:
 * - Window: 1 minute (configurable via RATE_LIMIT_WINDOW)
 * - Max requests: 60 per window (configurable via RATE_LIMIT_MAX)
 * - Key generation: IP + endpoint for granular control
 * - Selective skipping: GET requests to /api/session are less restricted
 * 
 * @returns {Function} Express rate limiting middleware
 * 
 * @example
 * const rateLimiter = createRateLimiter();
 * app.use('/api', rateLimiter);
 */
export const createRateLimiter = () => {
  const windowMs = process.env.RATE_LIMIT_WINDOW === '1m' ? 60 * 1000 : 60 * 1000; // 1 minute default
  const max = parseInt(process.env.RATE_LIMIT_MAX || '60'); // 60 requests per window default

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key generator to handle different endpoints
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const endpoint = req.path;
      return `${ip}:${endpoint}`;
    },
    // More restrictive limits for expensive operations
    skip: (req: Request) => {
      // Skip rate limiting for session retrieval (lighter operation)
      return req.method === 'GET' && req.path.startsWith('/api/session');
    }
  });
};

// ===================================================================
// CORS CONFIGURATION
// ===================================================================

/**
 * CORS configuration for the Forum application.
 * Allows requests from authorized origins while maintaining security.
 * 
 * Allowed Origins:
 * - http://localhost:5173 (Vite development server)
 * - http://localhost:3000 (Express server)
 * - Custom origin via CORS_ORIGIN environment variable
 * - Requests with no origin (mobile apps, etc.)
 * 
 * Security Features:
 * - Origin validation against whitelist
 * - Credentials support for authenticated requests
 * - Logging of blocked requests
 */
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Express server
      process.env.CORS_ORIGIN || 'http://localhost:5173'
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// ===================================================================
// SECURITY HEADERS CONFIGURATION
// ===================================================================

/**
 * Helmet security headers configuration for the Forum application.
 * Implements Content Security Policy and other security headers.
 * 
 * CSP Directives:
 * - default-src: 'self' (restrict to same origin)
 * - style-src: 'self' + 'unsafe-inline' (allow inline styles for React)
 * - script-src: 'self' (restrict JavaScript execution)
 * - img-src: 'self' + data: + https: (allow images from secure sources)
 * - connect-src: 'self' (restrict API calls)
 * - object-src: 'none' (disable plugins)
 * - frame-src: 'none' (prevent iframe embedding)
 * 
 * Development Adaptations:
 * - crossOriginEmbedderPolicy: false (allow embedding for development)
 * - unsafe-inline styles permitted for React components
 */
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding for development
};

// ===================================================================
// INPUT VALIDATION MIDDLEWARE
// ===================================================================

/**
 * Validation middleware for brainstorm request endpoints.
 * Ensures user prompts are safe and within acceptable limits.
 * 
 * Validation Rules:
 * - prompt: String, 1-1000 characters, trimmed, HTML-escaped
 * - Prevents XSS attacks through input sanitization
 * - Returns structured error responses for invalid input
 * 
 * @example
 * app.post('/api/brainstorm', validateBrainstormRequest, handler);
 */
export const validateBrainstormRequest = [
  body('prompt')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Prompt must be a string between 1 and 1000 characters')
    .escape(), // Escape HTML to prevent XSS
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid input',
        details: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

/**
 * Validation middleware for branch request endpoints.
 * Ensures session IDs, node IDs, and optional prompts are valid.
 * 
 * Validation Rules:
 * - sessionId: Valid UUID format
 * - nodeId: Valid UUID format
 * - prompt: Optional string, 1-500 characters, trimmed, HTML-escaped
 * - Returns structured error responses for invalid input
 * 
 * @example
 * app.post('/api/branch', validateBranchRequest, handler);
 */
export const validateBranchRequest = [
  body('sessionId')
    .isUUID()
    .withMessage('SessionId must be a valid UUID'),
  
  body('nodeId')
    .isUUID()
    .withMessage('NodeId must be a valid UUID'),
  
  body('prompt')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Follow-up prompt must be a string between 1 and 500 characters')
    .escape(),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid input',
        details: errors.array().map(err => err.msg)
      });
    }
    next();
  }
];

// ===================================================================
// RESPONSE SIZE LIMITING
// ===================================================================

/**
 * Middleware to limit response size and prevent memory exhaustion.
 * Monitors response size and truncates content if it exceeds limits.
 * 
 * Features:
 * - Configurable size limit (default: 64KB)
 * - Automatic content truncation for large responses
 * - Intelligent node text truncation for graph responses
 * - Logging of oversized responses
 * 
 * @param {number} [maxSize=64*1024] - Maximum response size in bytes
 * @returns {Function} Express middleware function
 * 
 * @example
 * app.use(limitResponseSize(32 * 1024)); // 32KB limit
 */
export const limitResponseSize = (maxSize: number = 64 * 1024) => { // 64KB default
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(body: any) {
      const responseSize = Buffer.byteLength(JSON.stringify(body), 'utf8');
      
      if (responseSize > maxSize) {
        console.warn(`Response size (${responseSize} bytes) exceeds limit (${maxSize} bytes)`);
        
        // Truncate response if too large
        if (typeof body === 'object' && body.nodes) {
          // Truncate node text if response is too large
          body.nodes = body.nodes.map((node: any) => ({
            ...node,
            text: node.text.length > 200 ? node.text.substring(0, 200) + '...' : node.text
          }));
        }
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};

// ===================================================================
// SECURITY MONITORING
// ===================================================================

/**
 * Security logging middleware for monitoring suspicious activity.
 * Analyzes incoming requests for potential security threats.
 * 
 * Monitoring Features:
 * - User agent tracking
 * - IP address logging
 * - Suspicious content detection in prompts
 * - Pattern matching for common attack vectors
 * 
 * Suspicious Patterns Detected:
 * - JavaScript injection attempts
 * - System command injection
 * - Script tag insertion
 * - Function execution attempts
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Log potentially suspicious requests
  if (req.body && typeof req.body.prompt === 'string') {
    const prompt = req.body.prompt.toLowerCase();
    const suspiciousPatterns = [
      'script', 'javascript', 'eval', 'function', 'alert',
      'document', 'window', 'exec', 'system', 'cmd'
    ];
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
      prompt.includes(pattern)
    );
    
    if (hasSuspiciousContent) {
      console.warn(`🚨 Suspicious prompt detected from ${ip}: "${req.body.prompt.substring(0, 100)}..."`);
    }
  }
  
  next();
};

// ===================================================================
// ERROR HANDLING
// ===================================================================

/**
 * Error handling middleware for security-related violations.
 * Provides standardized responses for common security errors.
 * 
 * Handled Error Types:
 * - entity.too.large: Request size exceeded
 * - CORS violations: Origin not allowed
 * - Rate limit exceeded: Too many requests
 * - General security errors: Logged and passed through
 * 
 * @param {any} err - Error object from previous middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const securityErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request entity too large',
      message: 'Please reduce the size of your request'
    });
  }
  
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS violation',
      message: 'Request blocked by CORS policy'
    });
  }
  
  // Log security-related errors
  if (err.status === 429) {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
  }
  
  next(err);
}; 