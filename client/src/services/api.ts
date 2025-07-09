/**
 * ===================================================================
 * API SERVICE - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This service provides the client-side API interface for communicating
 * with the Forum server. It handles all HTTP requests for brainstorming
 * sessions, conversation branching, and session management.
 * 
 * The API service abstracts the complexity of HTTP communication and
 * provides a clean interface for the React components to interact with
 * the backend personality services.
 * 
 * Key Features:
 * - Type-safe API calls with shared TypeScript interfaces
 * - Comprehensive error handling for network requests
 * - Session management for conversation persistence
 * - Real-time conversation branching support
 * - Server statistics and monitoring
 * 
 * API Endpoints:
 * - POST /api/brainstorm - Create new brainstorming session
 * - POST /api/branch - Branch existing conversation
 * - GET /api/session/:id - Retrieve session data
 * - GET /api/stats - Server statistics
 * 
 * Error Handling:
 * - Network errors are propagated as Error objects
 * - HTTP status codes are checked for successful responses
 * - Response validation through TypeScript interfaces
 * 
 * Dependencies:
 * - Shared types for API contracts
 * - Native Fetch API for HTTP requests
 * - JSON serialization for request/response bodies
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import type { BrainstormRequest, BrainstormResponse, BranchRequest, BranchResponse } from '../../../shared/types';

// ===================================================================
// API CONFIGURATION
// ===================================================================

/**
 * Base URL for all API requests.
 * Configured to work with the Express server running on the same origin.
 */
const API_BASE = '/api';

// ===================================================================
// MAIN API SERVICE
// ===================================================================

/**
 * Brainstorming API service providing all client-server communication.
 * Handles session creation, conversation branching, and data retrieval.
 */
export const brainstormApi = {
  /**
   * Creates a new brainstorming session with personality responses.
   * 
   * This is the primary function for starting Forum conversations.
   * It sends a user prompt to the server and receives a complete
   * session with three personality responses (Optimist, Pessimist, Realist).
   * 
   * Process:
   * 1. Sends POST request to /api/brainstorm
   * 2. Server generates responses from all three personalities
   * 3. Server creates session with graph structure
   * 4. Returns session ID and initial graph data
   * 
   * @param {string} prompt - The user's topic or question to explore
   * @returns {Promise<BrainstormResponse>} Session data with nodes and edges
   * 
   * @throws {Error} If the HTTP request fails or returns non-2xx status
   * 
   * @example
   * const session = await brainstormApi.createSession("Starting a tech startup");
   * // Returns: { sessionId: "uuid", nodes: [...], edges: [...] }
   */
  async createSession(prompt: string): Promise<BrainstormResponse> {
    const response = await fetch(`${API_BASE}/brainstorm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt } as BrainstormRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Expands a conversation node with new personality responses.
   * 
   * This function enables users to explore deeper into any personality's
   * response by generating follow-up responses from all three personalities.
   * It supports optional follow-up prompts for more specific exploration.
   * 
   * Process:
   * 1. Sends POST request to /api/branch
   * 2. Server validates session and node existence
   * 3. Server generates new personality responses
   * 4. Server adds new nodes and edges to the session
   * 5. Returns new graph elements
   * 
   * @param {string} sessionId - The UUID of the session to expand
   * @param {string} nodeId - The UUID of the node to branch from
   * @param {string} [followUpPrompt] - Optional follow-up question for more specific exploration
   * @returns {Promise<BranchResponse>} New nodes and edges added to the graph
   * 
   * @throws {Error} If the HTTP request fails or returns non-2xx status
   * 
   * @example
   * const branch = await brainstormApi.expandNode(
   *   "session-uuid", 
   *   "node-uuid", 
   *   "What about funding challenges?"
   * );
   * // Returns: { newNodes: [...], newEdges: [...] }
   */
  async expandNode(sessionId: string, nodeId: string, followUpPrompt?: string): Promise<BranchResponse> {
    const response = await fetch(`${API_BASE}/branch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sessionId, 
        nodeId, 
        prompt: followUpPrompt 
      } as BranchRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Retrieves an existing session's complete graph data.
   * 
   * This function loads a previously created session, useful for
   * resuming conversations or sharing sessions with others.
   * 
   * @param {string} sessionId - The UUID of the session to retrieve
   * @returns {Promise<BrainstormResponse>} Complete session data
   * 
   * @throws {Error} If the HTTP request fails, session not found, or returns non-2xx status
   * 
   * @example
   * const session = await brainstormApi.getSession("session-uuid");
   * // Returns: { sessionId: "uuid", nodes: [...], edges: [...] }
   */
  async getSession(sessionId: string): Promise<BrainstormResponse> {
    const response = await fetch(`${API_BASE}/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Retrieves server statistics for monitoring and analytics.
   * 
   * This function provides insights into system usage, including
   * session counts, graph complexity, and conversation metrics.
   * 
   * @returns {Promise<Object>} Statistics object with session and graph data
   * 
   * @throws {Error} If the HTTP request fails or returns non-2xx status
   * 
   * @example
   * const stats = await brainstormApi.getStats();
   * // Returns: { totalSessions: 5, totalNodes: 20, totalEdges: 15, averageNodesPerSession: 4 }
   */
  async getStats(): Promise<{totalSessions: number, totalNodes: number, totalEdges: number, averageNodesPerSession: number}> {
    const response = await fetch(`${API_BASE}/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
}; 