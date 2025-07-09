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
 * - Intelligent node positioning to prevent overlap
 * - In-memory session storage for MVP deployment
 * - Session statistics and monitoring
 * 
 * Graph Structure:
 * - Root nodes: User-submitted prompts
 * - Response nodes: AI personality responses (Optimist, Pessimist, Realist)
 * - Directed edges: Show conversation flow and relationships
 * - Triangle formation: Initial responses positioned to avoid overlap
 * - Horizontal expansion: Branched conversations spread horizontally
 * 
 * Dependencies:
 * - UUID for unique node/edge/session identifiers
 * - Shared types for consistent data structures
 * 
 * @author Forum Development Team
 * @version 1.0.0
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
 * This is the primary function called when a user submits a new topic
 * for exploration by the AI personalities.
 * 
 * Graph Structure Created:
 * - 1 root prompt node (centered)
 * - 3 personality response nodes (triangle formation)
 * - 3 edges connecting prompt to responses
 * 
 * Positioning Strategy:
 * - Root node: Center of canvas (400, 100)
 * - Optimist: Top right (650, 50)
 * - Pessimist: Bottom right (650, 300)
 * - Realist: Left (150, 175)
 * - Fallback: Circular arrangement for additional responses
 * 
 * @param {string} prompt - The user's original topic or question
 * @param {PersonalityResponse[]} personalityResponses - Array of AI personality responses
 * @returns {Session} Complete session object with nodes, edges, and metadata
 * 
 * @example
 * const session = createSession("Starting a tech startup", [
 *   { persona: 'optimist', text: "Great opportunity...", color: 'green' },
 *   { persona: 'pessimist', text: "Consider the risks...", color: 'red' },
 *   { persona: 'realist', text: "Balanced approach...", color: 'grey' }
 * ]);
 */
export const createSession = (prompt: string, personalityResponses: PersonalityResponse[]): Session => {
  const sessionId = uuidv4();
  
  // Create root prompt node (centered)
  const rootNode: Node = {
    id: uuidv4(),
    text: prompt,
    type: 'prompt',
    position: { x: 400, y: 100 }
  };
  
  // Create personality response nodes with improved positioning
  // Use fixed positions for the three personalities to ensure no overlap
  const responseNodes: Node[] = personalityResponses.map((response, index) => {
    let x: number, y: number;
    
    // Fixed positions for the 3 personalities (triangle formation)
    switch (index) {
      case 0: // Optimist - top right
        x = 650;
        y = 50;
        break;
      case 1: // Pessimist - bottom right  
        x = 650;
        y = 300;
        break;
      case 2: // Realist - left
        x = 150;
        y = 175;
        break;
      default: // Fallback for any additional responses
        const angle = (index * 2 * Math.PI) / personalityResponses.length;
        const radius = 300;
        x = 400 + radius * Math.cos(angle);
        y = 250 + radius * Math.sin(angle);
    }
    
    return {
      id: uuidv4(),
      text: response.text,
      parentId: rootNode.id,
      type: 'response',
      position: { x, y },
      persona: response.persona,
      color: response.color
    };
  });
  
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
  console.info(`✅ Created Forum session ${sessionId} with ${personalityResponses.length} personality responses`);
  return session;
};

// ===================================================================
// GRAPH EXPANSION FUNCTIONS
// ===================================================================

/**
 * Adds a new conversation branch to an existing session.
 * This function enables users to explore deeper into any personality's
 * response by generating follow-up responses from all three personalities.
 * 
 * Branching Process:
 * 1. Validates session and parent node existence
 * 2. Creates optional follow-up prompt node
 * 3. Generates new personality response nodes
 * 4. Positions new nodes to avoid overlap
 * 5. Creates edges to connect new nodes
 * 6. Updates session with new graph elements
 * 
 * Positioning Strategy:
 * - Follow-up prompt: Offset from parent (x+150, y+200)
 * - Personality responses: Horizontal spread below anchor
 * - Optimist: Left (-300 from anchor)
 * - Pessimist: Center (at anchor x)
 * - Realist: Right (+300 from anchor)
 * 
 * @param {string} sessionId - The ID of the session to expand
 * @param {string} parentNodeId - The node to branch from
 * @param {PersonalityResponse[]} personalityResponses - New personality responses
 * @param {string} [followUpPrompt] - Optional follow-up question
 * @returns {{newNodes: Node[], newEdges: Edge[]}} New graph elements added
 * 
 * @throws {Error} If session or parent node not found
 * 
 * @example
 * const branch = addBranch("session-123", "node-456", personalityResponses, "What about funding?");
 * // Returns: { newNodes: [...], newEdges: [...] }
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
      position: { 
        x: parentNode.position.x + 150, 
        y: parentNode.position.y + 200 
      }
    };
    newNodes.push(promptNode);
  }
  
  // Create personality response nodes with better spacing
  const anchorNode = promptNode || parentNode;
  const personalityNodes: Node[] = personalityResponses.map((response, index) => {
    // Use horizontal spacing for branches to avoid overlap
    const baseX = anchorNode.position.x;
    const baseY = anchorNode.position.y + 250;
    
    let x: number, y: number;
    
    switch (index) {
      case 0: // Optimist - left
        x = baseX - 300;
        y = baseY;
        break;
      case 1: // Pessimist - center
        x = baseX;
        y = baseY;
        break;
      case 2: // Realist - right
        x = baseX + 300;
        y = baseY;
        break;
      default: // Fallback
        x = baseX + (index - 1) * 200;
        y = baseY;
    }
    
    return {
      id: uuidv4(),
      text: response.text,
      parentId: anchorNode.id,
      type: 'response',
      position: { x, y },
      persona: response.persona,
      color: response.color
    };
  });
  
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
  
  // Update session
  session.nodes.push(...newNodes);
  session.edges.push(...newEdges);
  
  console.info(`✅ Added branch to session ${sessionId}: ${newNodes.length} nodes, ${newEdges.length} edges`);
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
