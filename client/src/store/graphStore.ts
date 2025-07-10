/**
 * ===================================================================
 * GRAPH STORE - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This store manages the client-side state for the conversation graph
 * in the Forum application. It provides a centralized state management
 * solution for graph data, session information, and UI state.
 * 
 * The store uses Zustand for lightweight, efficient state management
 * with minimal boilerplate. It handles all graph-related state changes
 * and provides a clean interface for React components.
 * 
 * State Management:
 * - Graph data (nodes and edges)
 * - Session identification
 * - Loading states for async operations
 * - Error states for user feedback
 * - Graph manipulation operations
 * 
 * Key Features:
 * - Immutable state updates
 * - Automatic error clearing on successful operations
 * - Incremental graph updates for branching
 * - Session persistence support
 * - Loading state management
 * 
 * Dependencies:
 * - Zustand for state management
 * - Shared types for graph data structures
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import { create } from 'zustand';
import type { Node, Edge } from '../../../shared/types';

// ===================================================================
// GRAPH STATE INTERFACE
// ===================================================================

/**
 * Interface defining the complete graph state structure.
 * Includes all data and operations needed for graph management.
 */
interface GraphState {
  // ===================================================================
  // STATE PROPERTIES
  // ===================================================================
  
  /** Array of all nodes in the current conversation graph */
  nodes: Node[];
  
  /** Array of all edges connecting nodes in the current graph */
  edges: Edge[];
  
  /** UUID of the current session, null if no session is active */
  sessionId: string | null;
  
  /** Boolean indicating if an async operation is in progress */
  isLoading: boolean;
  
  /** Error message string, null if no error occurred */
  error: string | null;

  /** Node content overlay state */
  overlayNode: Node | null;
  
  /** Boolean indicating if overlay is visible */
  isOverlayVisible: boolean;

  // ===================================================================
  // STATE ACTIONS
  // ===================================================================
  
  /**
   * Sets the complete graph state with nodes, edges, and session ID.
   * Used when initializing a new session or loading an existing one.
   * 
   * @param {Node[]} nodes - Array of nodes to set
   * @param {Edge[]} edges - Array of edges to set
   * @param {string} [sessionId] - Optional session ID to associate with the graph
   */
  setGraph: (nodes: Node[], edges: Edge[], sessionId?: string) => void;
  
  /**
   * Adds new nodes and edges to the existing graph.
   * Used for incremental updates when branching conversations.
   * 
   * @param {Node[]} newNodes - Array of new nodes to add
   * @param {Edge[]} newEdges - Array of new edges to add
   */
  addNodes: (newNodes: Node[], newEdges: Edge[]) => void;
  
  /**
   * Sets the loading state for the graph.
   * Used to show/hide loading indicators during async operations.
   * 
   * @param {boolean} loading - Whether a loading operation is in progress
   */
  setLoading: (loading: boolean) => void;
  
  /**
   * Sets the error state for the graph.
   * Automatically clears loading state when an error occurs.
   * 
   * @param {string | null} error - Error message or null to clear error
   */
  setError: (error: string | null) => void;
  
  /**
   * Clears all graph data and resets state.
   * Used when starting a new session or resetting the application.
   */
  clearGraph: () => void;

  /**
   * Shows the content overlay for a specific node.
   * 
   * @param {Node} node - The node to display in the overlay
   */
  showOverlay: (node: Node) => void;

  /**
   * Hides the content overlay.
   */
  hideOverlay: () => void;
}

// ===================================================================
// ZUSTAND STORE CREATION
// ===================================================================

/**
 * Creates and exports the graph store using Zustand.
 * Provides a reactive state management solution for the conversation graph.
 * 
 * Store Features:
 * - Immutable state updates
 * - Automatic error clearing on successful operations
 * - Incremental graph updates for performance
 * - Session persistence support
 * - Loading state management
 * - Content overlay management
 * 
 * @example
 * // In a React component
 * const { nodes, edges, setGraph, addNodes, setLoading, showOverlay } = useGraphStore();
 * 
 * // Set initial graph
 * setGraph(initialNodes, initialEdges, sessionId);
 * 
 * // Add new nodes from branching
 * addNodes(newNodes, newEdges);
 * 
 * // Show loading state
 * setLoading(true);
 * 
 * // Show content overlay
 * showOverlay(selectedNode);
 */
export const useGraphStore = create<GraphState>((set) => ({
  // ===================================================================
  // INITIAL STATE
  // ===================================================================
  
  nodes: [],
  edges: [],
  sessionId: null,
  isLoading: false,
  error: null,
  overlayNode: null,
  isOverlayVisible: false,
  
  // ===================================================================
  // STATE ACTIONS IMPLEMENTATION
  // ===================================================================
  
  /**
   * Sets the complete graph state with nodes, edges, and session ID.
   * Clears any existing error state on successful update.
   * 
   * @param {Node[]} nodes - Array of nodes to set
   * @param {Edge[]} edges - Array of edges to set
   * @param {string} [sessionId] - Optional session ID to associate with the graph
   */
  setGraph: (nodes, edges, sessionId) => set({ 
    nodes, 
    edges, 
    sessionId: sessionId || null,
    error: null 
  }),
  
  /**
   * Adds new nodes and edges to the existing graph.
   * Uses spread operator to maintain immutability.
   * Clears any existing error state on successful update.
   * 
   * @param {Node[]} newNodes - Array of new nodes to add
   * @param {Edge[]} newEdges - Array of new edges to add
   */
  addNodes: (newNodes, newEdges) => set((state) => ({
    nodes: [...state.nodes, ...newNodes],
    edges: [...state.edges, ...newEdges],
    error: null
  })),
  
  /**
   * Sets the loading state for the graph.
   * Used to show/hide loading indicators during async operations.
   * 
   * @param {boolean} isLoading - Whether a loading operation is in progress
   */
  setLoading: (isLoading) => set({ isLoading }),
  
  /**
   * Sets the error state for the graph.
   * Automatically clears loading state when an error occurs.
   * 
   * @param {string | null} error - Error message or null to clear error
   */
  setError: (error) => set({ error, isLoading: false }),
  
  /**
   * Clears all graph data and resets state to initial values.
   * Used when starting a new session or resetting the application.
   */
  clearGraph: () => set({ 
    nodes: [], 
    edges: [], 
    sessionId: null, 
    error: null, 
    overlayNode: null, 
    isOverlayVisible: false 
  }),

  /**
   * Shows the content overlay for a specific node.
   * 
   * @param {Node} node - The node to display in the overlay
   */
  showOverlay: (node) => set({ 
    overlayNode: node, 
    isOverlayVisible: true 
  }),

  /**
   * Hides the content overlay.
   */
  hideOverlay: () => set({ 
    overlayNode: null, 
    isOverlayVisible: false 
  }),
}));
