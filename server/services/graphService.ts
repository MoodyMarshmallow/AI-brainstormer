/**
 * ===================================================================
 * GRAPH SERVICE - Forum AI Brainstorming Application
 * ===================================================================
 * 
 * This service manages the conversation graph data structure and session
 * lifecycle for the Forum application. It handles the creation, modification,
 * and persistence of conversation sessions with their associated nodes and edges.
 * 
 * The Forum graph represents conversations as:
 * - NODES: User prompts and AI personality responses
 * - EDGES: Connections showing conversation flow
 * - SESSIONS: Complete conversation graphs with metadata
 * 
 * Key Features:
 * - Session creation with initial personality responses
 * - Graph expansion through branching conversations
 * - D3 force simulation positioning (client-side)
 * - Dynamic positioning for optimal graph organization
 * - In-memory session storage for MVP deployment
 * - Session statistics and monitoring
 * 
 * Graph Structure:
 * - Root nodes: User-submitted prompts
 * - Response nodes: AI personality responses
 * - Directed edges: Show conversation flow and relationships
 * - D3 force simulation: Automatic physics-based positioning
 * - Dynamic expansion: New branches integrate naturally
 * 
 * Dependencies:
 * - UUID for unique node/edge/session identifiers
 * - Shared types for consistent data structures
 * 
 * @author Forum Development Team
 * @version 2.0.0
 * @since 2024
 */

import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge, Session, PersonalityResponse } from '../../shared/types.js';

// ===================================================================
// SESSION STORAGE
// ===================================================================

/**
 * In-memory session storage for MVP deployment.
 * In production, this would be replaced with a database solution.
 * 
 * Key: Session ID (UUID)
 * Value: Complete session object with nodes, edges, and metadata
 */
const sessions = new Map<string, Session>();

// ===================================================================
// SESSION CREATION FUNCTIONS
// ===================================================================

/**
 * Creates a new conversation session with initial personality responses.
 * Nodes are created without positioning - D3 force simulation handles layout.
 * 
 * @param {string} prompt - The user's original topic or question
 * @param {PersonalityResponse[]} personalityResponses - Array of AI personality responses
 * @returns {Session} Complete session object with nodes and edges
 */
export const createSession = (prompt: string, personalityResponses: PersonalityResponse[]): Session => {
  const sessionId = uuidv4();
  
  // Create root prompt node (no position - D3 will handle this)
  const rootNode: Node = {
    id: uuidv4(),
    text: prompt,
    type: 'prompt',
    position: { x: 0, y: 0 } // Initial position, D3 will override
  };
  
  // Create personality response nodes (no position - D3 will handle this)
  const responseNodes: Node[] = personalityResponses.map((response) => ({
    id: uuidv4(),
    text: response.text,
    parentId: rootNode.id,
    type: 'response',
    position: { x: 0, y: 0 }, // Initial position, D3 will override
    persona: response.persona,
    color: response.color
  }));
  
  // Create edges connecting prompt to personality responses
  const edges: Edge[] = responseNodes.map(node => ({
    id: uuidv4(),
    source: rootNode.id,
    target: node.id
  }));
  
  const session: Session = {
    id: sessionId,
    nodes: [rootNode, ...responseNodes],
    edges,
    createdAt: new Date()
  };
  
  sessions.set(sessionId, session);
  console.info(`✅ Created Forum session ${sessionId} with D3 force simulation layout for ${personalityResponses.length} personality responses`);
  return session;
};

// ===================================================================
// GRAPH EXPANSION FUNCTIONS
// ===================================================================

/**
 * Adds a new conversation branch to an existing session.
 * D3 force simulation handles optimal positioning automatically.
 * 
 * @param {string} sessionId - The ID of the session to expand
 * @param {string} parentNodeId - The node to branch from
 * @param {PersonalityResponse[]} personalityResponses - New personality responses
 * @param {string} [followUpPrompt] - Optional follow-up question
 * @returns {{newNodes: Node[], newEdges: Edge[]}} New graph elements added
 */
export const addBranch = (sessionId: string, parentNodeId: string, personalityResponses: PersonalityResponse[], followUpPrompt?: string): { newNodes: Node[], newEdges: Edge[] } => {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  const parentNode = session.nodes.find(node => node.id === parentNodeId);
  if (!parentNode) {
    throw new Error('Parent node not found');
  }
  
  // Create follow-up prompt node if provided
  const newNodes: Node[] = [];
  let promptNode: Node | null = null;
  
  if (followUpPrompt) {
    promptNode = {
      id: uuidv4(),
      text: followUpPrompt,
      parentId: parentNodeId,
      type: 'prompt',
      position: { x: 0, y: 0 } // D3 will handle positioning
    };
    newNodes.push(promptNode);
  }
  
  // Create personality response nodes
  const anchorNode = promptNode || parentNode;
  const personalityNodes: Node[] = personalityResponses.map((response) => ({
    id: uuidv4(),
    text: response.text,
    parentId: anchorNode.id,
    type: 'response',
    position: { x: 0, y: 0 }, // D3 will handle positioning
    persona: response.persona,
    color: response.color
  }));
  
  newNodes.push(...personalityNodes);
  
  // Create edges
  const newEdges: Edge[] = [];
  
  // Edge from parent to follow-up prompt (if exists)
  if (promptNode) {
    newEdges.push({
      id: uuidv4(),
      source: parentNodeId,
      target: promptNode.id
    });
  }
  
  // Edges from anchor node to personality responses
  personalityNodes.forEach(node => {
    newEdges.push({
      id: uuidv4(),
      source: anchorNode.id,
      target: node.id
    });
  });
  
  // Add new nodes and edges to session
  session.nodes.push(...newNodes);
  session.edges.push(...newEdges);
  
  sessions.set(sessionId, session);
  
  console.info(`✅ Added branch to session ${sessionId} with D3 force simulation: ${newNodes.length} nodes, ${newEdges.length} edges`);
  return { newNodes, newEdges };
};

// ===================================================================
// BACKWARD COMPATIBILITY FUNCTIONS
// ===================================================================

/**
 * Adds a branch with simple string responses (backward compatibility).
 * This function maintains compatibility with older API versions that
 * provided simple string responses instead of structured personality responses.
 * 
 * @param {string} sessionId - The ID of the session to expand
 * @param {string} parentNodeId - The node to branch from
 * @param {string[]} responses - Array of simple string responses
 * @returns {{newNodes: Node[], newEdges: Edge[]}} New graph elements added
 * 
 * @deprecated Use addBranch with PersonalityResponse[] instead
 */
export const addSimpleBranch = (sessionId: string, parentNodeId: string, responses: string[]): { newNodes: Node[], newEdges: Edge[] } => {
  // Convert simple responses to personality responses for backward compatibility
  const personalityResponses: PersonalityResponse[] = responses.map((response, index) => {
    const personas: Array<{name: string, color: string}> = [
      { name: 'optimist', color: 'green' },
      { name: 'pessimist', color: 'red' },
      { name: 'realist', color: 'grey' }
    ];
    const persona = personas[index] || { name: 'realist', color: 'grey' };
    
    return {
      persona: persona.name as any,
      text: response,
      color: persona.color
    };
  });
  
  return addBranch(sessionId, parentNodeId, personalityResponses);
};

// ===================================================================
// SESSION RETRIEVAL FUNCTIONS
// ===================================================================

/**
 * Retrieves a specific session by its ID.
 * 
 * @param {string} sessionId - The unique identifier of the session
 * @returns {Session | undefined} The session object or undefined if not found
 */
export const getSession = (sessionId: string): Session | undefined => {
  return sessions.get(sessionId);
};

/**
 * Retrieves all existing sessions.
 * Useful for administration and monitoring purposes.
 * 
 * @returns {Session[]} Array of all session objects
 */
export const getAllSessions = (): Session[] => {
  return Array.from(sessions.values());
};

// ===================================================================
// MONITORING AND STATISTICS
// ===================================================================

/**
 * Calculates and returns session statistics for monitoring purposes.
 * Provides insights into system usage and graph complexity.
 * 
 * @returns {Object} Statistics object containing:
 *   - totalSessions: Number of active sessions
 *   - totalNodes: Total nodes across all sessions
 *   - totalEdges: Total edges across all sessions
 *   - averageNodesPerSession: Average graph complexity
 * 
 * @example
 * const stats = getSessionStats();
 * // Returns: { totalSessions: 5, totalNodes: 20, totalEdges: 15, averageNodesPerSession: 4 }
 */
export const getSessionStats = () => {
  const totalSessions = sessions.size;
  const totalNodes = Array.from(sessions.values()).reduce((sum, session) => sum + session.nodes.length, 0);
  const totalEdges = Array.from(sessions.values()).reduce((sum, session) => sum + session.edges.length, 0);
  
  return {
    totalSessions,
    totalNodes,
    totalEdges,
    averageNodesPerSession: totalSessions > 0 ? Math.round(totalNodes / totalSessions) : 0
  };
};
