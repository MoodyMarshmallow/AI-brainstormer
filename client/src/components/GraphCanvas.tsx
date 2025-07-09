/**
 * ===================================================================
 * GRAPH CANVAS - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This component provides the main graph visualization interface for the
 * Forum application. It renders the conversation graph using React Flow
 * and enables interactive exploration of AI personality responses.
 * 
 * The GraphCanvas displays conversation nodes and edges in an interactive
 * graph format, allowing users to click on personality responses to
 * generate deeper explorations of topics.
 * 
 * Key Features:
 * - Interactive graph visualization with React Flow
 * - Click-to-expand personality responses
 * - Real-time graph updates for branching conversations
 * - Responsive design with loading states and error handling
 * - Personality-based color coding and styling
 * - Empty state with helpful instructions
 * - Minimap and controls for navigation
 * 
 * Graph Structure:
 * - Prompt nodes: User-submitted topics (input type)
 * - Response nodes: AI personality responses (default type)
 * - Edges: Connections showing conversation flow
 * 
 * Personality System:
 * - Optimist: Green nodes with opportunity focus
 * - Pessimist: Red nodes with risk analysis
 * - Realist: Gray nodes with balanced perspective
 * 
 * Dependencies:
 * - React Flow for graph visualization
 * - Zustand store for state management
 * - API service for server communication
 * - Shared types for data structures
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from '@xyflow/react';
import { useGraphStore } from '../store/graphStore';
import { brainstormApi } from '../services/api';
import { CustomNode } from './CustomNode';
import type { Node as GraphNode, Edge as GraphEdge, PersonalityName } from '../../../shared/types';
// import './GraphCanvas.css'; // REMOVED FOR TESTING

import '@xyflow/react/dist/style.css';

// ===================================================================
// NODE TYPES DEFINITION
// ===================================================================

const nodeTypes = {
  custom: CustomNode,
};

// ===================================================================
// GRAPH CONVERSION UTILITIES
// ===================================================================

/**
 * Converts internal graph nodes to React Flow nodes with appropriate styling.
 * 
 * This function transforms the application's graph data structure into
 * React Flow compatible nodes with personality-based styling and labels.
 * 
 * Node Types:
 * - Prompt nodes: Input type with blue styling
 * - Response nodes: Default type with personality-based colors
 * 
 * Styling Features:
 * - Personality color coding (green/red/gray)
 * - Truncated text display for readability
 * - Consistent sizing and border radius
 * - Accessibility-friendly color contrast
 * 
 * @param {GraphNode[]} nodes - Array of internal graph nodes
 * @returns {Node[]} Array of React Flow compatible nodes
 */
const convertToReactFlowNodes = (nodes: GraphNode[]): Node[] => {
  return nodes.map(node => {
    const isPrompt = node.type === 'prompt';
    
    // Simplified text display for readability
    const displayText = node.text.length > 100 ? node.text.substring(0, 100) + '...' : node.text;
    
    // Create label for custom node
    const nodeLabel = isPrompt 
      ? displayText
      : `${node.persona?.toUpperCase()}: ${displayText}`;

    return {
      id: node.id,
      type: 'custom',
      position: node.position,
      data: { 
        label: nodeLabel,
        persona: node.persona,
        isPrompt: isPrompt
      },
      draggable: true,
      selectable: true,
      focusable: true,
    };
  });
};

/**
 * Converts internal graph edges to React Flow edges with enhanced styling.
 * 
 * This function transforms the application's edge data structure into
 * React Flow compatible edges with visual enhancements optimized for
 * radial layouts and draggable nodes.
 * 
 * Edge Features:
 * - Bezier curves for natural flow in radial layouts
 * - Subtle animation for visual interest
 * - Consistent color and stroke width
 * - Read-only edges (no manual connections allowed)
 * - Optimized for viewing conversation relationships
 * 
 * @param {GraphEdge[]} edges - Array of internal graph edges
 * @returns {Edge[]} Array of React Flow compatible edges (read-only)
 */
const convertToReactFlowEdges = (edges: GraphEdge[]): Edge[] => {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    style: { 
      stroke: '#94a3b8', 
      strokeWidth: 2,
      strokeOpacity: 0.7
    },
    type: 'default', // Use default bezier curves for better radial layout
    animated: true,
    focusable: false, // Disable edge selection
    selectable: false, // Disable edge selection completely
    interactionWidth: 20, // Wider interaction area for easier selection
  }));
};

// ===================================================================
// MAIN GRAPH CANVAS COMPONENT
// ===================================================================

/**
 * Main GraphCanvas component for rendering the conversation graph.
 * 
 * This component provides the complete graph visualization interface,
 * including interactive node expansion, loading states, error handling,
 * and empty state guidance.
 * 
 * Component Features:
 * - Real-time graph updates from Zustand store
 * - Click-to-expand personality responses
 * - Draggable nodes for manual positioning
 * - Loading overlay during async operations
 * - Empty state with personality introductions
 * - Minimap and controls for navigation
 * 
 * User Interactions:
 * - Click on personality nodes to expand conversations
 * - Drag nodes to reposition them manually
 * - Use controls for zooming and panning
 * - Navigate using minimap
 * - No manual edge connections allowed
 * 
 * @returns {JSX.Element} The complete graph canvas interface
 */
export const GraphCanvas: React.FC = () => {
  const {
    nodes: graphNodes,
    edges: graphEdges,
    sessionId,
    isLoading,
    error,
    addNodes,
    setLoading,
    setError
  } = useGraphStore();

  const [nodes, setNodesState, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState<Edge>([]);

  /**
   * Updates React Flow nodes and edges when graph state changes.
   * Ensures the visualization stays synchronized with the data store.
   */
  useEffect(() => {
    const reactFlowNodes = convertToReactFlowNodes(graphNodes);
    const reactFlowEdges = convertToReactFlowEdges(graphEdges);
    setNodesState(reactFlowNodes);
    setEdgesState(reactFlowEdges);
  }, [graphNodes, graphEdges, setNodesState, setEdgesState]);

  /**
   * Handles node click events to expand personality responses.
   * 
   * This function manages the core interaction for exploring deeper
   * into personality responses by generating new conversation branches.
   * 
   * Click Behavior:
   * - Only personality response nodes are clickable
   * - Prompt nodes and loading states are ignored
   * - Generates new responses from all three personalities
   * - Updates the graph with new nodes and edges
   * 
   * Error Handling:
   * - Validates session and node existence
   * - Displays user-friendly error messages
   * - Maintains loading states during async operations
   * 
   * @param {any} event - React Flow click event
   * @param {any} node - Clicked node object
   */
  const onNodeClick = useCallback(async (event: any, node: any) => {
    // Only allow clicking on personality response nodes (not prompt nodes)
    if (node.data.isPrompt || isLoading) return;

    // Find the original graph node to get personality info
    const originalNode = graphNodes.find(n => n.id === node.id);
    if (!originalNode || !originalNode.persona) return;

    console.info(`🎯 Expanding ${originalNode.persona} response:`, originalNode.text.substring(0, 100));

    try {
      setLoading(true);
      setError(null);

      if (!sessionId) {
        throw new Error('No active session');
      }

      // Forum expansion always generates 3 personality responses
      const response = await brainstormApi.expandNode(sessionId, node.id);
      addNodes(response.newNodes, response.newEdges);
      
      console.info(`✅ Added ${response.newNodes.length} new nodes from personality expansion`);
    } catch (err) {
      console.error('❌ Failed to expand node:', err);
      setError('Failed to expand idea. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, isLoading, graphNodes, addNodes, setLoading, setError]);

  // ===================================================================
  // RENDER STATES
  // ===================================================================

  /**
   * Renders the empty state when no conversation has been started.
   * Provides a minimal fullscreen canvas ready for interaction.
   */
  if (graphNodes.length === 0 && !isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f8fafc'
      }}>
        <div style={{ 
          textAlign: 'center', 
          color: '#64748b', 
          maxWidth: '400px',
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#334155', fontSize: '1.8rem', fontWeight: '700' }}>🎭 Forum</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Enter a topic below to explore it through three distinct AI personalities</p>
        </div>
      </div>
    );
  }

  /**
   * Renders the fullscreen graph interface with minimal UI elements.
   * Includes error handling, loading states, and the React Flow canvas.
   */
  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh'
    }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '0', 
          left: '0', 
          right: '0', 
          bottom: '0', 
          background: 'rgba(255, 255, 255, 0.9)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: '100',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '24px 32px', 
            borderRadius: '12px', 
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)', 
            fontWeight: '600', 
            color: '#667eea', 
            fontSize: '16px', 
            border: '2px solid #e0e7ff' 
          }}>
            🎭 Generating personality perspectives...
          </div>
        </div>
      )}
      
      {/* React Flow Canvas - Fullscreen */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 50, // Add padding around the graph
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 2
        }}
        attributionPosition="bottom-right"
        style={{ width: '100%', height: '100%' }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }} // Start with a slight zoom out for better radial view
        minZoom={0.1}
        maxZoom={2}
        snapToGrid={false} // Disable grid snapping for smoother radial layout
        snapGrid={[15, 15]}
        nodesDraggable={true} // Enable node dragging globally
        nodesConnectable={false} // Completely disable node connections
        elementsSelectable={true} // Enable element selection
        selectNodesOnDrag={false} // Don't select nodes when dragging
        panOnDrag={true} // Enable panning when dragging empty space
        panOnScroll={false} // Disable pan on scroll for better zoom control
        zoomOnScroll={true} // Enable zoom with scroll
        zoomOnPinch={true} // Enable pinch zoom on touch devices
        zoomOnDoubleClick={false} // Disable double-click zoom to prevent interference with node clicks
        preventScrolling={true} // Prevent page scrolling when interacting with the graph
        deleteKeyCode={null} // Disable delete key for nodes/edges
        multiSelectionKeyCode={null} // Disable multi-selection for simplicity
      >
        <Background 
          gap={20} 
          size={1} 
          color="#e2e8f0"
        />
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={false} // Hide interactive toggle for simplicity
          position="bottom-left"
        />
        <MiniMap 
          nodeColor={(node) => {
            if (node.data?.isPrompt) return '#667eea';
            switch (node.data?.persona) {
              case 'optimist': return '#10b981';
              case 'pessimist': return '#ef4444';
              case 'realist': return '#6b7280';
              default: return '#94a3b8';
            }
          }}
          position="top-right"
          nodeStrokeWidth={2}
          nodeBorderRadius={8}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default GraphCanvas;
