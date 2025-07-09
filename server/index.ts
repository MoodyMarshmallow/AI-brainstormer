/**
 * ===================================================================
 * FORUM SERVER - AI Brainstorming Application
 * ===================================================================
 * 
 * This is the main server file for the Forum AI brainstorming application.
 * It sets up an Express.js server with comprehensive security middleware
 * and API endpoints for personality-based AI conversations.
 * 
 * Forum is an AI brainstorming tool that explores ideas through three
 * distinct AI personalities: Optimist, Pessimist, and Realist.
 * 
 * Server Features:
 * - RESTful API endpoints for brainstorming and conversation branching
 * - Multi-layered security middleware (rate limiting, CORS, validation)
 * - Session management for conversation persistence
 * - Real-time personality response generation
 * - Health monitoring and statistics
 * - Comprehensive error handling and logging
 * 
 * API Endpoints:
 * - POST /api/brainstorm - Start new brainstorming session
 * - POST /api/branch - Branch existing conversation
 * - GET /api/session/:id - Retrieve session data
 * - GET /api/stats - Server statistics
 * - GET /api/health - Health check
 * 
 * Security Features:
 * - Rate limiting (60 requests/minute per IP)
 * - CORS protection with origin whitelist
 * - Input validation and sanitization
 * - Security headers (Helmet)
 * - Response size limiting
 * - Security logging and monitoring
 * 
 * Dependencies:
 * - Express.js for web server framework
 * - Personality and graph services for AI functionality
 * - Security middleware for protection
 * - Shared types for API contracts
 * 
 * Environment Variables:
 * - PORT: Server port (default: 3000)
 * - GEMINI_API_KEY: Google Gemini API key for AI responses
 * - RATE_LIMIT_MAX: Rate limit per window (default: 60)
 * - RATE_LIMIT_WINDOW: Rate limit window (default: 1m)
 * - CORS_ORIGIN: Allowed CORS origin (default: localhost:5173)
 * - NODE_ENV: Environment mode (development/production)
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generatePersonalityResponses, generatePersonalityBranch } from './services/personalityService.js';
import { createSession, addBranch, getSession, getSessionStats } from './services/graphService.js';
import { 
  createRateLimiter, 
  corsOptions, 
  helmetOptions,
  validateBrainstormRequest,
  validateBranchRequest,
  limitResponseSize,
  securityLogger,
  securityErrorHandler
} from './middleware/security.js';
import type { BrainstormRequest, BranchRequest } from '../shared/types.js';

// ===================================================================
// SERVER INITIALIZATION
// ===================================================================

const app = express();
const port = process.env.PORT || 3000;

// ===================================================================
// SECURITY MIDDLEWARE SETUP
// ===================================================================

// Trust first proxy for rate limiting (required for proper IP detection)
app.set('trust proxy', 1);

// Apply security middleware in order
app.use(helmet(helmetOptions)); // Security headers
app.use(cors(corsOptions)); // CORS protection
app.use(express.json({ limit: '10mb' })); // Body parser with size limit
app.use(limitResponseSize()); // Response size limiting
app.use(securityLogger); // Security logging

// Rate limiting for API endpoints
const rateLimiter = createRateLimiter();
app.use('/api', rateLimiter);

// ===================================================================
// CORE API ENDPOINTS
// ===================================================================

/**
 * POST /api/brainstorm
 * 
 * Creates a new brainstorming session with personality responses.
 * This is the primary endpoint for starting Forum conversations.
 * 
 * Process:
 * 1. Validates and sanitizes user input
 * 2. Generates responses from all three AI personalities
 * 3. Creates a new session with graph structure
 * 4. Returns session ID and initial graph data
 * 
 * Request Body:
 * - prompt: String (1-1000 characters) - The topic to explore
 * 
 * Response:
 * - sessionId: UUID of the created session
 * - nodes: Array of graph nodes (prompt + 3 personality responses)
 * - edges: Array of graph edges connecting nodes
 * 
 * Security:
 * - Rate limited (60 requests/minute per IP)
 * - Input validation and sanitization
 * - XSS prevention through HTML escaping
 * - Request size limiting
 * 
 * @example
 * POST /api/brainstorm
 * {
 *   "prompt": "Starting a tech startup"
 * }
 * 
 * Response:
 * {
 *   "sessionId": "uuid-here",
 *   "nodes": [...],
 *   "edges": [...]
 * }
 */
app.post('/api/brainstorm', validateBrainstormRequest, async (req, res) => {
  try {
    const { prompt }: BrainstormRequest = req.body;
    
    console.info(`🎭 Forum brainstorm request: "${prompt.substring(0, 100)}..." from IP: ${req.ip}`);
    
    // Generate personality responses (always exactly 3: Optimist, Pessimist, Realist)
    const personalityResponses = await generatePersonalityResponses(prompt);
    
    if (personalityResponses.length === 0) {
      return res.status(500).json({ error: 'Failed to generate personality responses' });
    }
    
    // Create session with personality-aware graph structure
    const session = createSession(prompt, personalityResponses);
    
    console.info(`✅ Forum session created: ${session.id} with ${personalityResponses.length} personality responses`);
    
    res.json({
      sessionId: session.id,
      nodes: session.nodes,
      edges: session.edges
    });
    
  } catch (error) {
    console.error('Forum brainstorm API error:', error);
    res.status(500).json({ error: 'Failed to generate Forum brainstorm responses' });
  }
});

/**
 * GET /api/session/:id
 * 
 * Retrieves an existing session's complete graph data.
 * Used for loading previous conversations or sharing sessions.
 * 
 * URL Parameters:
 * - id: UUID of the session to retrieve
 * 
 * Response:
 * - sessionId: UUID of the session
 * - nodes: Array of all nodes in the session
 * - edges: Array of all edges in the session
 * 
 * Security:
 * - Lighter rate limiting (retrieval is less expensive)
 * - UUID format validation
 * - Session existence validation
 * 
 * Error Responses:
 * - 400: Invalid session ID format
 * - 404: Session not found
 * - 500: Server error
 * 
 * @example
 * GET /api/session/123e4567-e89b-12d3-a456-426614174000
 */
app.get('/api/session/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Basic session ID validation
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID format' });
    }
    
    const session = getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      sessionId: session.id,
      nodes: session.nodes,
      edges: session.edges
    });
    
  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

/**
 * POST /api/branch
 * 
 * Branches an existing conversation by generating new personality responses.
 * Allows users to explore deeper into any personality's response.
 * 
 * Process:
 * 1. Validates session and node existence
 * 2. Generates new personality responses based on parent node
 * 3. Optionally incorporates follow-up prompt
 * 4. Adds new nodes and edges to the session
 * 5. Returns new graph elements
 * 
 * Request Body:
 * - sessionId: UUID of the session to branch
 * - nodeId: UUID of the node to branch from
 * - prompt: Optional follow-up question (1-500 characters)
 * 
 * Response:
 * - newNodes: Array of new nodes added to the graph
 * - newEdges: Array of new edges added to the graph
 * 
 * Security:
 * - Rate limited (60 requests/minute per IP)
 * - Input validation for UUIDs and optional prompt
 * - Session and node existence validation
 * - XSS prevention through HTML escaping
 * 
 * @example
 * POST /api/branch
 * {
 *   "sessionId": "uuid-here",
 *   "nodeId": "node-uuid-here",
 *   "prompt": "What about funding challenges?"
 * }
 */
app.post('/api/branch', validateBranchRequest, async (req, res) => {
  try {
    const { sessionId, nodeId, prompt: followUpPrompt }: BranchRequest = req.body;
    
    // Get the node to branch from
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const parentNode = session.nodes.find(node => node.id === nodeId);
    if (!parentNode) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    console.info(`🌳 Forum branch request: node ${nodeId} in session ${sessionId} from IP: ${req.ip}`);
    if (followUpPrompt) {
      console.info(`📝 Follow-up prompt: "${followUpPrompt.substring(0, 100)}..."`);
    }
    
    // Generate personality responses for the branch
    const personalityResponses = await generatePersonalityBranch(parentNode.text, followUpPrompt);
    
    if (personalityResponses.length === 0) {
      return res.status(500).json({ error: 'Failed to generate personality branch responses' });
    }
    
    // Add branch to session with personality responses
    const { newNodes, newEdges } = addBranch(sessionId, nodeId, personalityResponses, followUpPrompt);
    
    console.info(`✅ Forum branch added: ${newNodes.length} nodes, ${newEdges.length} edges`);
    
    res.json({
      newNodes,
      newEdges
    });
    
  } catch (error) {
    console.error('Forum branch API error:', error);
    res.status(500).json({ error: 'Failed to create Forum branch' });
  }
});

// ===================================================================
// MONITORING AND HEALTH ENDPOINTS
// ===================================================================

/**
 * GET /api/stats
 * 
 * Provides server statistics for monitoring and analytics.
 * Includes session data, security configuration, and system metrics.
 * 
 * Response:
 * - totalSessions: Number of active sessions
 * - totalNodes: Total nodes across all sessions
 * - totalEdges: Total edges across all sessions
 * - averageNodesPerSession: Average conversation complexity
 * - rateLimitWindow: Current rate limit window
 * - rateLimitMax: Current rate limit maximum
 * - corsOrigin: Configured CORS origin
 * - timestamp: Current server timestamp
 * 
 * @example
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = getSessionStats();
    
    // Add security information to stats
    const securityStats = {
      ...stats,
      rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '1m',
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60'),
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      timestamp: new Date().toISOString()
    };
    
    res.json(securityStats);
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring system availability.
 * Provides basic system information and uptime metrics.
 * 
 * Response:
 * - status: 'healthy' if system is operational
 * - service: Service name ('Forum')
 * - personalities: Array of available AI personalities
 * - timestamp: Current server timestamp
 * - uptime: Server uptime in seconds
 * 
 * @example
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Forum',
    personalities: ['optimist', 'pessimist', 'realist'],
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===================================================================
// ERROR HANDLING MIDDLEWARE
// ===================================================================

// Security-specific error handling
app.use(securityErrorHandler);

/**
 * Global error handler for unhandled errors.
 * Provides consistent error responses and logging.
 * 
 * Development vs Production:
 * - Development: Detailed error messages for debugging
 * - Production: Generic error messages to avoid information leakage
 * 
 * @param {any} err - Error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ===================================================================
// SERVER STARTUP
// ===================================================================

/**
 * Starts the Forum server with comprehensive logging.
 * Displays configuration information and available endpoints.
 */
app.listen(port, () => {
  console.log(`🎭 Forum Server running on port ${port}`);
  console.log(`📡 API available at http://localhost:${port}/api`);
  console.log(`🎨 Three personalities ready: Optimist, Pessimist, Realist`);
  console.log(`🔒 Security features enabled:`);
  console.log(`   - Rate limiting: ${process.env.RATE_LIMIT_MAX || '60'} requests per ${process.env.RATE_LIMIT_WINDOW || '1m'}`);
  console.log(`   - CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`   - Security headers: Helmet enabled`);
  console.log(`   - Input validation: Express-validator enabled`);
  console.log(`   - Response size limit: 64KB`);
});
